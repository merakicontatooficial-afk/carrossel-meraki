// ─────────────────────────────────────────────────────────────
// Camada Gemini — único ponto que fala com o Google.
// Texto (carrossel/refino/legenda), imagem (Nano Banana + Pro) e
// trends (Google Search grounding). Modelos centralizados aqui.
// ─────────────────────────────────────────────────────────────
import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "./prompts.js";

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) {
  console.warn(
    "[gemini] GEMINI_API_KEY vazia — crie a chave da CONTA DA MERAKI em " +
      "https://aistudio.google.com/apikey e cole no .env. As rotas de IA vão falhar até lá."
  );
}

const ai = new GoogleGenAI({ apiKey: KEY });

export const MODELS = {
  text: process.env.GEMINI_MODEL_TEXT || "gemini-flash-latest",
};

/**
 * Modelos de imagem oferecidos na plataforma — o usuário escolhe na hora de gerar.
 * Teste visual de 29/07/2026 (mesmo prompt nos três): todos devolvem 928×1152 com
 * arquivo equivalente; o Lite só perde em microtextura de pele em rosto grande.
 * Por isso o PADRÃO é o Lite (1/4 do preço do Pro e ~8× mais rápido).
 */
export const IMAGE_MODELS = {
  lite: process.env.GEMINI_MODEL_IMAGE_LITE || "gemini-3.1-flash-lite-image",
  flash: process.env.GEMINI_MODEL_IMAGE_FLASH || "gemini-3.1-flash-image",
  pro: process.env.GEMINI_MODEL_IMAGE_PRO || "gemini-3-pro-image",
};
export const IMAGE_MODEL_DEFAULT = "lite";

/**
 * Resolução pedida por modelo. Regra: subir de tier só quando NÃO custa mais.
 *  - pro   → 2K (1856×2304): o Google cobra o MESMO por 1K e 2K (US$ 0,134);
 *            só o 4K é mais caro (US$ 0,24). Então 2K é ganho de graça.
 *  - flash → 1K: no Nano Banana 2 o 2K custa mais (0,101 vs 0,067).
 *  - lite  → 1K: a própria API recusa 2K ("not supported for this model").
 * Verificado ao vivo em 29/07/2026.
 */
export const IMAGE_SIZES = { pro: "2K" };

/** Aceita a chave ("lite"|"flash"|"pro"); qualquer outra coisa cai no padrão. */
export function resolveImageModel(modelo) {
  return IMAGE_MODELS[modelo] || IMAGE_MODELS[IMAGE_MODEL_DEFAULT];
}

/** Garante que a chave existe antes de gastar uma chamada. */
function assertKey() {
  if (!KEY) throw new Error("GEMINI_API_KEY ausente no servidor (.env).");
}

/**
 * Gera conteúdo de texto estruturado (JSON) a partir de um schema.
 * Usado por carrossel/refino/legenda.
 */
export async function generateJson({ prompt, schema, system }) {
  assertKey();
  const res = await ai.models.generateContent({
    model: MODELS.text,
    contents: prompt,
    config: {
      ...(system ? { systemInstruction: system } : {}),
      responseMimeType: "application/json",
      ...(schema ? { responseSchema: schema } : {}),
      temperature: 0.9,
    },
  });
  const text = res.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    // fallback: extrai o primeiro bloco {...} ou [...]
    const m = text.match(/[[{][\s\S]*[\]}]/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Gemini não devolveu JSON válido: " + text.slice(0, 200));
  }
}

/**
 * Pesquisa o tema na web (Google Search grounding) e devolve um briefing factual
 * curto — usado para "alimentar" a geração do carrossel com dados reais, não achismo.
 */
export async function researchTopic(tema) {
  assertKey();
  try {
    const res = await ai.models.generateContent({
      model: MODELS.text,
      contents:
        `Pesquise fatos atuais, dados, números e exemplos concretos sobre: "${tema}". ` +
        `Devolva um briefing em 5-8 bullets curtos, só fatos verificáveis e específicos (nada genérico). Em português.`,
      config: { tools: [{ googleSearch: {} }], temperature: 0.3 },
    });
    return (res.text ?? "").trim();
  } catch {
    return ""; // se o grounding falhar, segue sem — geração não quebra
  }
}

/** Texto livre (ex.: refino curto de um slide). */
export async function generateText({ prompt, system, temperature = 0.8 }) {
  assertKey();
  const res = await ai.models.generateContent({
    model: MODELS.text,
    contents: prompt,
    config: { ...(system ? { systemInstruction: system } : {}), temperature },
  });
  return (res.text ?? "").trim();
}

/** Proporções aceitas pelos modelos de imagem do Gemini. */
export const ASPECTOS = ["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"];

/**
 * Gera imagem. `refImageBase64` (opcional, sem prefixo data:) faz a IA usar aquele
 * rosto/produto de referência. `modelo` = "lite" | "flash" | "pro" (padrão: lite).
 * `aspecto` = proporção do destino (ex.: "4:5" no fundo, "16:9" no cartão) — sem ela
 * o modelo devolve o formato que quiser e a imagem chega torta no slide.
 * Retorna { dataUrl } pronto pra virar bgImage do slide.
 */
export async function generateImage({ prompt, refImageBase64, refMime = "image/jpeg", refs, contexto, modelo, aspecto, fast = false }) {
  assertKey();
  // `fast` é o formato antigo (booleano) — mantido para não quebrar chamadas velhas
  const chave = IMAGE_MODELS[modelo] ? modelo : fast ? "lite" : IMAGE_MODEL_DEFAULT;
  const model = resolveImageModel(chave);

  const imageConfig = {
    ...(ASPECTOS.includes(aspecto) ? { aspectRatio: aspecto } : {}),
    ...(IMAGE_SIZES[chave] ? { imageSize: IMAGE_SIZES[chave] } : {}),
  };

  // AGENTE DE FOTOGRAFIA: a descrição do usuário vira um briefing de foto real.
  const parts = [{ text: buildImagePrompt(prompt, contexto) }];
  // múltiplas referências (até 3): rosto, produto, estilo… `refs` = [{ data, mime }]
  const lista = Array.isArray(refs) && refs.length
    ? refs
    : refImageBase64
      ? [{ data: refImageBase64, mime: refMime }]
      : [];
  for (const r of lista.slice(0, 3)) {
    if (r?.data) parts.push({ inlineData: { mimeType: r.mime || "image/jpeg", data: r.data } });
  }

  const res = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    ...(Object.keys(imageConfig).length ? { config: { imageConfig } } : {}),
  });

  // procura a primeira parte de imagem na resposta
  const cand = res.candidates?.[0];
  const imgPart = cand?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) {
    throw new Error("Gemini não devolveu imagem (verifique o modelo/limite).");
  }
  const mime = imgPart.inlineData.mimeType || "image/png";
  return { dataUrl: `data:${mime};base64,${imgPart.inlineData.data}`, model };
}

/**
 * Trends — Gemini com Google Search grounding: traz notícias em alta sobre um tema,
 * já resumidas. `period`: hoje | semana | mes | qualquer.
 */
export async function fetchTrends({ query, period = "semana", limit = 8 }) {
  assertKey();
  const periodo = { hoje: "nas últimas 24h", semana: "nos últimos 7 dias", mes: "nos últimos 30 dias", qualquer: "recentemente" }[period] || "recentemente";
  const res = await ai.models.generateContent({
    model: MODELS.text,
    contents:
      `Liste ${limit} notícias/assuntos em ALTA ${periodo} sobre "${query}". ` +
      `Para cada um devolva um objeto com: titulo, fonte, quando (ex.: "há 3 horas"), resumo (1 frase). ` +
      `Responda SOMENTE um array JSON.`,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.4,
    },
  });
  const text = res.text ?? "";
  const m = text.match(/\[[\s\S]*\]/);
  try {
    return m ? JSON.parse(m[0]) : [];
  } catch {
    return [];
  }
}

/**
 * Trending do dia no Brasil — assuntos MAIS EM ALTA agora (geral: entretenimento,
 * esporte, cultura pop, tecnologia, celebridades, notícias). Google Search grounding.
 * Cacheado por dia no banco (ver rota /trends/daily).
 */
export async function fetchDailyTrends({ limit = 10 } = {}) {
  assertKey();
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const res = await ai.models.generateContent({
    model: MODELS.text,
    contents:
      `Hoje é ${hoje}. Liste os ${limit} ASSUNTOS/NOTÍCIAS MAIS EM ALTA no BRASIL agora — ` +
      `o que está realmente viralizando e repercutindo (trending). Misture entretenimento, ` +
      `esporte, cultura pop, tecnologia, celebridades e notícias gerais; priorize o que está ` +
      `bombando de fato. Para cada um devolva: titulo, categoria (uma palavra), fonte, ` +
      `quando (ex.: "hoje", "há 2 dias"), resumo (1 frase clara). Responda SOMENTE um array JSON.`,
    config: { tools: [{ googleSearch: {} }], temperature: 0.5 },
  });
  const text = res.text ?? "";
  const m = text.match(/\[[\s\S]*\]/);
  try {
    return m ? JSON.parse(m[0]) : [];
  } catch {
    return [];
  }
}
