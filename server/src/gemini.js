// ─────────────────────────────────────────────────────────────
// Camada Gemini — único ponto que fala com o Google.
// Texto (carrossel/refino/legenda), imagem (Nano Banana + Pro) e
// trends (Google Search grounding). Modelos centralizados aqui.
// ─────────────────────────────────────────────────────────────
import { GoogleGenAI } from "@google/genai";
import { buildImagePrompt } from "./prompts.js";
import * as settings from "./settings.js";

// A chave e os modelos vêm de settings.js (painel → .env → padrão), resolvidos a
// CADA chamada — trocar a chave nas Configurações vale na hora, sem reiniciar.
let _client = null;
let _clientKey = null;
function client() {
  const key = settings.get("gemini_api_key");
  if (!key) throw new Error("Chave da API não configurada. Ajuste em Configurações → API de IA.");
  if (!_client || _clientKey !== key) {
    _client = new GoogleGenAI({ apiKey: key });
    _clientKey = key;
  }
  return _client;
}

if (!settings.get("gemini_api_key")) {
  console.warn(
    "[gemini] sem chave — configure em Configurações → API de IA (ou GEMINI_API_KEY no .env). " +
      "As rotas de IA vão falhar até lá."
  );
}

/** Modelo de texto vigente (carrossel, refino, legenda, trends). */
const modelText = () => settings.get("modelo_texto");

/**
 * Modelos de imagem oferecidos na plataforma — o usuário escolhe na hora de gerar.
 * Teste visual de 29/07/2026 (mesmo prompt nos três): todos devolvem 928×1152 com
 * arquivo equivalente; o Lite só perde em microtextura de pele em rosto grande.
 * Por isso o PADRÃO é o Lite (1/4 do preço do Pro e ~8× mais rápido).
 */
export const imageModels = () => ({
  lite: settings.get("modelo_img_lite"),
  flash: settings.get("modelo_img_flash"),
  pro: settings.get("modelo_img_pro"),
});
export const IMAGE_MODEL_DEFAULT = "lite";
export const NIVEIS = ["lite", "flash", "pro"];

/**
 * Resolução pedida por modelo. Regra: subir de tier só quando NÃO custa mais.
 *  - pro   → 2K (1856×2304): o Google cobra o MESMO por 1K e 2K (US$ 0,134);
 *            só o 4K é mais caro (US$ 0,24). Então 2K é ganho de graça.
 *  - flash → 1K: no Nano Banana 2 o 2K custa mais (0,101 vs 0,067).
 *  - lite  → 1K: a própria API recusa 2K ("not supported for this model").
 * Verificado ao vivo em 29/07/2026.
 */
export const IMAGE_SIZES = { pro: "2K" };

/** Aceita o nível ("lite"|"flash"|"pro"); qualquer outra coisa cai no padrão. */
export function resolveImageModel(nivel) {
  const m = imageModels();
  return m[nivel] || m[IMAGE_MODEL_DEFAULT];
}

/**
 * Gera conteúdo de texto estruturado (JSON) a partir de um schema.
 * Usado por carrossel/refino/legenda.
 */
export async function generateJson({ prompt, schema, system }) {
  const res = await client().models.generateContent({
    model: modelText(),
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
  try {
    const res = await client().models.generateContent({
      model: modelText(),
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
  const res = await client().models.generateContent({
    model: modelText(),
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
  // `fast` é o formato antigo (booleano) — mantido para não quebrar chamadas velhas
  const nivel = NIVEIS.includes(modelo) ? modelo : fast ? "lite" : IMAGE_MODEL_DEFAULT;
  const model = resolveImageModel(nivel);

  const imageConfig = {
    ...(ASPECTOS.includes(aspecto) ? { aspectRatio: aspecto } : {}),
    ...(IMAGE_SIZES[nivel] ? { imageSize: IMAGE_SIZES[nivel] } : {}),
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

  const res = await client().models.generateContent({
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
  // `nivel` e `custoUsd` sobem junto p/ a rota registrar o consumo (painel de custos)
  return { dataUrl: `data:${mime};base64,${imgPart.inlineData.data}`, model, nivel, custoUsd: settings.CUSTO_IMAGEM_USD[nivel] ?? 0 };
}

/** Ping barato na API: confirma que a chave responde. Usado pelo botão "Testar". */
export async function testarChave() {
  const t0 = Date.now();
  const res = await client().models.generateContent({
    model: modelText(),
    contents: "Responda apenas com a palavra: ok",
    config: { temperature: 0 },
  });
  return { ok: true, ms: Date.now() - t0, modelo: modelText(), resposta: (res.text ?? "").trim().slice(0, 40) };
}

/**
 * Trends — Gemini com Google Search grounding: traz notícias em alta sobre um tema,
 * já resumidas. `period`: hoje | semana | mes | qualquer.
 */
export async function fetchTrends({ query, period = "semana", limit = 8 }) {
  const periodo = { hoje: "nas últimas 24h", semana: "nos últimos 7 dias", mes: "nos últimos 30 dias", qualquer: "recentemente" }[period] || "recentemente";
  const res = await client().models.generateContent({
    model: modelText(),
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
  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const res = await client().models.generateContent({
    model: modelText(),
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
