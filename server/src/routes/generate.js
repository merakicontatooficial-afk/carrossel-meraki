// Rotas de IA — proxy fino sobre a camada Gemini.
import { Router } from "express";
import { generateJson, generateText, generateImage, fetchTrends, fetchDailyTrends, researchTopic } from "../gemini.js";
import { buildSystem, carouselSchema, carouselPrompt, CAPTION_EXPERTISE } from "../prompts.js";
import { db } from "../db.js";

const router = Router();

// Envolve handlers async e manda erro pro middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// data de HOJE no fuso de São Paulo (YYYY-MM-DD)
const hojeSP = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

/** GET /api/generate/trends/daily → { date, items } — trending do Brasil, cache/dia.
 *  Atualiza sozinho a cada dia (primeira visita do dia regenera). */
router.get(
  "/trends/daily",
  wrap(async (_req, res) => {
    const date = hojeSP();
    const row = db.prepare("SELECT items FROM daily_trends WHERE date = ?").get(date);
    if (row) return res.json({ date, items: JSON.parse(row.items) });
    const items = await fetchDailyTrends({ limit: 10 });
    db.prepare("INSERT OR REPLACE INTO daily_trends (date, items, created_at) VALUES (?,?,?)").run(date, JSON.stringify(items), Date.now());
    res.json({ date, items });
  })
);

/** POST /api/generate/carousel  { tema, nSlides?, modelo? } → { slides[], legenda } */
router.post(
  "/carousel",
  wrap(async (req, res) => {
    const { tema, nSlides = 6, modelo = "minimalista", marca, idioma = "pt-BR" } = req.body || {};
    if (!tema || !String(tema).trim()) {
      return res.status(400).json({ error: "Informe o 'tema' do carrossel." });
    }
    const n = Math.max(3, Math.min(20, Number(nSlides) || 6));
    // 1) pesquisa fatos reais na web (grounding) → 2) escreve o carrossel embasado
    const briefing = await researchTopic(tema);
    const data = await generateJson({
      system: buildSystem(marca), // voz do CLIENTE (fallback = voz da Meraki)
      schema: carouselSchema,
      prompt: carouselPrompt({ tema, nSlides: n, modelo, briefing, idioma }),
    });
    res.json(data);
  })
);

/** POST /api/generate/image  { prompt, refImageBase64?, refMime?, hq? } → { dataUrl, model } */
router.post(
  "/image",
  wrap(async (req, res) => {
    const { prompt, refImageBase64, refMime, refs, contexto, fast = false } = req.body || {};
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Informe o 'prompt' da imagem." });
    }
    const out = await generateImage({ prompt, refImageBase64, refMime, refs, contexto, fast: !!fast });
    res.json(out);
  })
);

/** POST /api/refine/slide  { texto, instrucao } → { texto } */
router.post(
  "/refine",
  wrap(async (req, res) => {
    const { texto, instrucao, marca } = req.body || {};
    if (!texto || !instrucao) {
      return res.status(400).json({ error: "Informe 'texto' e 'instrucao'." });
    }
    const out = await generateText({
      system: buildSystem(marca),
      prompt: `Reescreva o texto abaixo seguindo a instrução. Devolva SÓ o texto novo, sem aspas.\n\nInstrução: ${instrucao}\n\nTexto:\n${texto}`,
    });
    res.json({ texto: out });
  })
);

/** POST /api/generate/caption  { tema, slides? } → { legenda }
 *  Agente de LEGENDA: regras da Meraki + dossiê da marca do cliente. */
router.post(
  "/caption",
  wrap(async (req, res) => {
    const { tema, slides, marca } = req.body || {};
    const lista = Array.isArray(slides) ? slides : [];
    const base = tema || lista.map((s) => s.headline).join(" / ");
    if (!base) return res.status(400).json({ error: "Informe 'tema' ou 'slides'." });

    // o conteúdo real do carrossel, slide a slide, pra legenda AMPLIAR (não repetir)
    const roteiro = lista.length
      ? lista.map((s, i) => `Slide ${i + 1} (${s.kind}): ${s.headline}${s.body ? ` — ${s.body}` : ""}`).join("\n")
      : `Tema: ${base}`;

    const out = await generateText({
      // voz do cliente (com dossiê) + expertise de legenda
      system: `${buildSystem(marca)}\n\n${CAPTION_EXPERTISE}`,
      prompt: `Escreva a legenda do post de Instagram deste carrossel.\n\nCONTEÚDO DO CARROSSEL:\n${roteiro}\n\nA legenda amplia o carrossel (contexto, exemplo, bastidor) — não repete os slides.`,
      temperature: 0.85,
    });
    res.json({ legenda: out });
  })
);

/** GET /api/generate/trends?q=&period=&limit= → [{ titulo, fonte, quando, resumo }] */
router.get(
  "/trends",
  wrap(async (req, res) => {
    const { q, period = "semana", limit = 8 } = req.query;
    if (!q) return res.status(400).json({ error: "Informe ?q= (tema)." });
    const items = await fetchTrends({ query: String(q), period: String(period), limit: Number(limit) || 8 });
    res.json({ items });
  })
);

export default router;
