// ─────────────────────────────────────────────────────────────
// Camada Gemini — único ponto que fala com o Google.
// Texto (carrossel/refino/legenda), imagem (Nano Banana + Pro) e
// trends (Google Search grounding). Modelos centralizados aqui.
// ─────────────────────────────────────────────────────────────
import { GoogleGenAI } from "@google/genai";

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
  image: process.env.GEMINI_MODEL_IMAGE || "gemini-3.1-flash-image", // Nano Banana (default)
  imagePro: process.env.GEMINI_MODEL_IMAGE_PRO || "gemini-3-pro-image", // Nano Banana Pro (4K, pago)
};

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

/**
 * Gera imagem. `refImageBase64` (opcional, sem prefixo data:) faz a IA usar aquele
 * rosto/produto de referência. `hq: true` usa Nano Banana Pro (4K, pago).
 * Retorna { dataUrl } pronto pra virar bgImage do slide.
 */
export async function generateImage({ prompt, refImageBase64, refMime = "image/jpeg", refs, hq = false }) {
  assertKey();
  const model = hq ? MODELS.imagePro : MODELS.image;

  const parts = [{ text: prompt }];
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
