// Converte a resposta da IA (AiCarousel) em slides/elementos do editor.
// Cada um dos 4 modelos tem layout FIEL ao visual viral do MyPostFlow, extraído
// frame a frame do vídeo (Minimalista · Profile · Creators · TechViral).
import type { AiCarousel, AiModelo, AiSlide } from "./api";
import type { BrandKit, CarouselCounter, Element, Slide, SlideColors, SlideKind } from "../types";
import { uid, CANVAS_W, CANVAS_H, SAFE_MARGIN } from "../types";
import { makeCarouselKit } from "../config/kits";

const M = SAFE_MARGIN; // 80
const W = CANVAS_W - 2 * M; // 920

function el(p: Partial<Element> & Pick<Element, "type">): Element {
  return { id: uid(), x: M, y: 0, w: W, h: 100, z: 10, ...p };
}
function slide(kind: SlideKind, elements: Element[], extra?: Partial<Slide>): Slide {
  return { id: uid("sl"), kind, elements, bg: "bg", colors: { locked: true }, ...extra };
}
/** override claro por slide (Creators/TechViral): fundo claro + texto escuro. */
function lightColors(bg: string, accent?: string): SlideColors {
  return { locked: false, bg, text: "#181026", accent };
}

// ── peças ────────────────────────────────────────────────────────────────────
const handlePill = (y: number, align: "left" | "center" = "left") =>
  el({ type: "text", role: "eyebrow", text: "", fontRole: "label", fontSize: 28, fontWeight: 600, align, color: "text", y, h: 64, z: 25 });

/** tag/categoria em pílula suave (lavanda) — usada em Creators/TechViral. */
const softTag = (text: string, y: number) => {
  const w = Math.min(760, 120 + text.length * 20);
  return el({
    type: "text", role: "cta-secondary", text: text.toUpperCase(), fontRole: "label",
    fontSize: 24, fontWeight: 700, letterSpacing: 1.5, align: "center", ctaVariant: "soft",
    color: "accent", x: M, w, y, h: 58, z: 25,
  });
};

const headline = (o: { text: string; y: number; size: number; h: number; up: boolean; align?: "left" | "center"; weight?: number; color?: string; lh?: number; w?: number }) =>
  el({
    type: "text", role: "headline", text: o.text, fontRole: "display",
    fontSize: o.size, fontWeight: o.weight ?? 800, lineHeight: o.lh ?? (o.up ? 1.05 : 1.12),
    letterSpacing: -0.5, uppercase: o.up, align: o.align ?? "left",
    color: o.color ?? "text", y: o.y, h: o.h, z: 20, ...(o.w != null ? { w: o.w } : {}),
  });

const bodyEl = (o: { text: string; y: number; h: number; align?: "left" | "center"; size?: number; color?: string; x?: number; w?: number }) =>
  el({
    type: "text", role: "body", text: o.text, fontRole: "body",
    fontSize: o.size ?? 36, fontWeight: 400, lineHeight: 1.5, align: o.align ?? "left",
    color: o.color ?? "muted", y: o.y, h: o.h, z: 20, ...(o.x != null ? { x: o.x } : {}), ...(o.w != null ? { w: o.w } : {}),
  });

/** slot de imagem (arredondado): vazio mostra placeholder no editor e SOME no export
 *  — evita "caixa cinza" incoerente quando não há imagem. */
const mediaSlot = (o: { x?: number; y: number; w?: number; h: number; radius?: number }) =>
  el({ type: "image", src: undefined, fit: "cover", radius: o.radius ?? 24, x: o.x ?? M, y: o.y, w: o.w ?? W, h: o.h, z: 8 });

// ── auto-layout: estima altura do texto e empilha sem gaps ───────────────────
const COUNTER_RESERVE = 96; // espaço reservado na base p/ o marcador (dots/bars)
const BOTTOM = CANVAS_H - M; // 1270

/** estimativa de altura (px) de um texto ao quebrar numa largura w. */
function estTextH(text: string, fontSize: number, lineHeight: number, w: number, upper = false): number {
  if (!text) return 0;
  const charW = fontSize * (upper ? 0.6 : 0.52);
  const cpl = Math.max(1, Math.floor(w / charW));
  const lines = text.split("\n").reduce((a, ln) => a + Math.max(1, Math.ceil(ln.trim().length / cpl)), 0);
  return Math.ceil(lines * fontSize * lineHeight);
}

const footerLabel = (text: string, align: "left" | "right", color = "muted") =>
  el({ type: "text", role: "body", text, fontRole: "label", fontSize: 24, fontWeight: 600, letterSpacing: 1, align, color, x: align === "right" ? CANVAS_W - M - 360 : M, w: 360, y: 1252, h: 40, z: 20 });

// ── proof / cta compartilhados (seguem o tom do modelo) ──────────────────────
function ctaSlide(ai: AiSlide, up: boolean): Slide {
  return slide("cta", [
    handlePill(230, "center"),
    headline({ text: ai.headline, y: 350, size: 66, h: 320, up, align: "center" }),
    ...(ai.body ? [bodyEl({ text: ai.body, y: 710, h: 150, align: "center", size: 38 })] : []),
    el({ type: "text", role: "cta-primary", text: "Salve para não esquecer", fontRole: "body", fontSize: 38, fontWeight: 700, align: "center", color: "bg", ctaVariant: "soft", ctaIcon: "bookmark", x: 170, w: 740, y: 900, h: 104, z: 20 }),
    el({ type: "social", x: M, y: 1070, w: W, h: 84, z: 20, color: "text", gap: 56, align: "center" }),
  ]);
}

// ── SLIDE COM FOTO DE FUNDO (full-bleed) — modo "Imagem de fundo" ────────────
// A foto (bgImage) é colocada depois pelo wizard. Texto empilhado justo e
// ancorado na base (viral), respeitando a reserva do marcador.
function photoSlide(ai: AiSlide, i: number, reserve = 0): Slide {
  const isCover = i === 0;
  const hlSize = isCover ? 72 : 58;
  const hlH = estTextH(ai.headline, hlSize, 1.06, W, true);
  const bH = ai.body ? estTextH(ai.body, 34, 1.45, W) : 0;
  const bottom = BOTTOM - reserve;
  const els: Element[] = [handlePill(150)];
  let y = bottom - hlH - (ai.body ? bH + 22 : 0);
  els.push(headline({ text: ai.headline, y, size: hlSize, h: hlH, up: true, weight: 800, lh: 1.06 }));
  y += hlH + 22;
  if (ai.body) els.push(bodyEl({ text: ai.body, y, h: bH, size: 34 }));
  return slide(isCover ? "cover" : "value", els, { scrim: 74, scrimPos: 58 });
}

// ── SLIDE COM CARTÃO DE IMAGEM HORIZONTAL (retângulo largo, estilo MyPostFlow) ─
// A capa usa foto de fundo; slides de conteúdo usam o cartão largo (paisagem).
// imgPos "base" (padrão) = texto em cima, imagem embaixo · "top" = imagem em cima.
function cardSlide(ai: AiSlide, opts?: { light?: { bg: string; text: string; muted: string; accent: string }; imgPos?: "top" | "base"; reserve?: number }): Slide {
  const light = opts?.light;
  const imgPos = opts?.imgPos ?? "base";
  const reserve = opts?.reserve ?? 0;
  const imgH = 520; // 920×520 = paisagem (horizontal)
  const hlH = estTextH(ai.headline, 50, 1.06, W, true);
  const bH = ai.body ? estTextH(ai.body, 32, 1.45, W) : 0;
  const bottom = BOTTOM - reserve;
  const tColor = light?.text ?? "text";
  const mColor = light?.muted ?? "muted";
  const img = (y: number) => mediaSlot({ x: M, y, w: W, h: imgH, radius: 28 });
  const els: Element[] = [handlePill(150)];

  if (imgPos === "top") {
    let y = 240;
    els.push(img(y)); y += imgH + 40;
    els.push(headline({ text: ai.headline, y, size: 50, h: hlH, up: true, weight: 800, color: tColor, lh: 1.06 })); y += hlH + 20;
    if (ai.body) els.push(bodyEl({ text: ai.body, y, h: bH, size: 32, color: mColor }));
  } else {
    let y = 240;
    els.push(headline({ text: ai.headline, y, size: 50, h: hlH, up: true, weight: 800, color: tColor, lh: 1.06 })); y += hlH + 20;
    if (ai.body) els.push(bodyEl({ text: ai.body, y, h: bH, size: 32, color: mColor }));
    els.push(img(bottom - imgH)); // ancorado embaixo, acima da reserva do marcador
  }
  return slide("value", els, { imgPos, ...(light ? { colors: { locked: false, bg: light.bg, text: light.text, accent: light.accent } } : {}) });
}

// paleta clara por modelo (para o cartão manter a coerência de Creators/TechViral)
const LIGHT: Partial<Record<AiModelo, { bg: string; text: string; muted: string; accent: string }>> = {
  creators: { bg: "#f7f1e8", text: "#181026", muted: "#5a5366", accent: "#c026a3" },
  techviral: { bg: "#f3eefc", text: "#1a1226", muted: "#4f4660", accent: "#6d28d9" },
};

// ── MINIMALISTA (texto ancorado no topo, empilhado justo por altura real) ─────
function minimalista(ai: AiSlide, i: number): Slide {
  if (ai.kind === "cta") return ctaSlide(ai, true);
  const isCover = i === 0;
  const hlSize = isCover ? 72 : 58;
  const hlH = estTextH(ai.headline, hlSize, 1.06, W, true);
  const els: Element[] = [handlePill(150)];
  let y = isCover ? 300 : 250;
  els.push(headline({ text: ai.headline, y, size: hlSize, h: hlH, up: true, weight: 800, lh: 1.06 }));
  y += hlH + 36;
  if (ai.body) els.push(bodyEl({ text: ai.body, y, h: estTextH(ai.body, 38, 1.5, W), size: 38 }));
  return slide(isCover ? "cover" : "value", els);
}

// ── PROFILE (tweet escuro) — ÚNICO modelo com retângulo de mídia (anexo do tweet)
function profile(ai: AiSlide, i: number, brandName: string, withMedia: boolean): Slide {
  if (ai.kind === "cta") return ctaSlide(ai, false);
  const name = brandName || "Sua Marca";
  const handle = "@" + name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 18);
  const topY = 250;
  // texto do tweet ocupa a altura toda quando não há mídia; encurta quando há.
  const tweetH = withMedia ? 300 : 620;
  return slide(i === 0 ? "cover" : "value", [
    // avatar (slot pequeno — foto/logo do perfil; editável, não é alvo da IA)
    mediaSlot({ x: M, y: topY, w: 92, h: 92, radius: 46 }),
    // nome + selo (● em acento)
    el({ type: "text", role: "body", text: `${name}  *●*`, fontRole: "body", fontSize: 38, fontWeight: 700, color: "text", x: M + 120, w: W - 140, y: topY + 6, h: 52, z: 10 }),
    el({ type: "text", role: "body", text: handle, fontRole: "body", fontSize: 30, fontWeight: 400, color: "muted", x: M + 120, w: W - 140, y: topY + 54, h: 42, z: 10 }),
    // texto do tweet
    el({ type: "text", role: "headline", text: ai.headline, fontRole: "body", fontSize: 44, fontWeight: 500, lineHeight: 1.3, letterSpacing: -0.5, color: "text", x: M, w: W, y: topY + 140, h: tweetH, z: 10 }),
    ...(ai.body ? [el({ type: "text", role: "body", text: ai.body, fontRole: "body", fontSize: 32, fontWeight: 400, lineHeight: 1.4, color: "muted", x: M, w: W, y: topY + 140 + tweetH + 12, h: 180, z: 10 })] : []),
    // retângulo de mídia do tweet — SÓ quando o slide foi marcado p/ imagem
    ...(withMedia ? [mediaSlot({ y: topY + 640, h: 470 })] : []),
  ]);
}

// ── CREATORS (capa escura + slides claros com grade de imagens) ──────────────
function creators(ai: AiSlide, i: number): Slide {
  if (ai.kind === "cta") return ctaSlide(ai, false);
  const isCover = i === 0;

  if (isCover) {
    return slide("cover", [
      handlePill(300, "center"),
      headline({ text: ai.headline, y: 430, size: 76, h: 400, up: true, align: "center", weight: 800 }),
      ...(ai.eyebrow ? [softTag(ai.eyebrow, 900)].map((e) => ({ ...e, x: (CANVAS_W - e.w) / 2 })) : []),
    ]);
  }
  // conteúdo claro, texto ancorado no topo e empilhado justo
  const cHlH = estTextH(ai.headline, 56, 1.08, W, true);
  const cEls: Element[] = ai.eyebrow ? [softTag(ai.eyebrow, 150)] : [];
  let cy = ai.eyebrow ? 250 : 220;
  cEls.push(headline({ text: ai.headline, y: cy, size: 56, h: cHlH, up: true, align: "left", weight: 800, color: "#181026", lh: 1.08 }));
  cy += cHlH + 34;
  if (ai.body) cEls.push(bodyEl({ text: ai.body, y: cy, h: estTextH(ai.body, 36, 1.5, W), size: 36, color: "#5a5366" }));
  cEls.push(footerLabel("Conteúdo", "left", "#7a7386"), footerLabel("Viral", "right", "#7a7386"));
  return slide("value", cEls, { colors: lightColors("#f7f1e8", "#c026a3") });
}

// ── TECHVIRAL (capa marca-texto + cards lavanda) ─────────────────────────────
function techviral(ai: AiSlide, i: number): Slide {
  if (ai.kind === "cta") return ctaSlide(ai, true);
  const isCover = i === 0;

  if (isCover) {
    return slide("cover", [
      handlePill(150),
      headline({ text: ai.headline, y: 300, size: 80, h: 440, up: true, weight: 800 }),
      ...(ai.body ? [bodyEl({ text: ai.body, y: 800, h: 240, size: 38 })] : []),
    ]);
  }
  // conteúdo: card lavanda claro, texto ancorado no topo e empilhado justo
  const tHlH = estTextH(ai.headline, 60, 1.06, W, true);
  const tEls: Element[] = ai.eyebrow ? [softTag(ai.eyebrow, 160)] : [];
  let ty = ai.eyebrow ? 260 : 230;
  tEls.push(headline({ text: ai.headline, y: ty, size: 60, h: tHlH, up: true, align: "left", weight: 800, color: "#1a1226", lh: 1.06 }));
  ty += tHlH + 34;
  if (ai.body) tEls.push(bodyEl({ text: ai.body, y: ty, h: estTextH(ai.body, 36, 1.5, W), size: 36, color: "#4f4660" }));
  return slide("value", tEls, { colors: lightColors("#f3eefc", "#6d28d9") });
}

// ── kit + counter por modelo ─────────────────────────────────────────────────
interface Style { base: "livre-escuro" | "livre-claro"; fontDisplay: string; eyebrow: BrandKit["eyebrow"]; accent2?: string | null; }
const STYLE: Record<AiModelo, Style> = {
  minimalista: { base: "livre-escuro", fontDisplay: "Inter", eyebrow: "handle" },
  profile: { base: "livre-escuro", fontDisplay: "Inter", eyebrow: "handle" },
  creators: { base: "livre-escuro", fontDisplay: "Sora", eyebrow: "handle", accent2: "#ff5db1" },
  techviral: { base: "livre-escuro", fontDisplay: "Space Grotesk", eyebrow: "handle" },
};

export function modeloKit(modelo: AiModelo, accent: string, name: string, brandName?: string): BrandKit {
  const s = STYLE[modelo];
  const kit = makeCarouselKit(s.base, name);
  kit.fontDisplay = s.fontDisplay;
  kit.eyebrow = s.eyebrow;
  kit.accent2 = s.accent2 ?? null;
  if (accent) kit.accent = accent;
  if (brandName) kit.logo = "@" + brandName.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 20);
  return kit;
}

export function modeloCounter(modelo: AiModelo): CarouselCounter | undefined {
  switch (modelo) {
    case "profile": return undefined;
    case "creators":
    case "techviral": return { style: "bars", pos: "tc", hideOnCover: false };
    default: return { style: "dots", pos: "bc", hideOnCover: true };
  }
}

/**
 * Converte a resposta da IA em slides. `imageSlides` = índices (1-based) que terão imagem.
 * - PROFILE: imagem vira o retângulo de mídia do tweet.
 * - Demais modelos: CAPA (slide 1) usa foto de fundo full-bleed; slides de conteúdo
 *   usam o cartão de imagem HORIZONTAL (retângulo largo) com o texto no topo.
 */
export function aiToSlides(ai: AiCarousel, modelo: AiModelo, opts?: { imageSlides?: number[]; brandName?: string; imgPos?: "top" | "base" }): Slide[] {
  const imageSlides = opts?.imageSlides ?? [];
  const brandName = opts?.brandName ?? "";
  const imgPos = opts?.imgPos ?? "base";
  // marcador na base? então reserva espaço p/ ele nos slides com imagem (auto-diagrama)
  const counter = modeloCounter(modelo);
  const baseCounter = !!counter && counter.style !== "none" && ["bc", "bl", "br"].includes(counter.pos);
  return ai.slides.map((s, i) => {
    const wantsImage = imageSlides.includes(i + 1) && s.kind !== "cta";
    const reserve = baseCounter && !(counter!.hideOnCover && i === 0) ? COUNTER_RESERVE : 0;
    if (modelo === "profile") return profile(s, i, brandName, wantsImage);
    if (wantsImage) return i === 0 ? photoSlide(s, i, reserve) : cardSlide(s, { light: LIGHT[modelo], imgPos, reserve });
    switch (modelo) {
      case "techviral": return techviral(s, i);
      case "creators": return creators(s, i);
      default: return minimalista(s, i);
    }
  });
}

/**
 * Reorganiza os elementos de um slide (headline · corpo · cartão de imagem) de cima
 * pra baixo, sem gaps, usando a altura real do texto. Respeita a escolha topo/base.
 * Usado no editor ("Auto-organizar" e no toggle Imagem no topo/base).
 */
export function autoLayout(slide: Slide, imgPosOverride?: "top" | "base"): Element[] {
  const els = slide.elements.map((e) => ({ ...e }));
  const pill = els.find((e) => e.role === "eyebrow");
  const headline = els.find((e) => e.role === "headline");
  const body = els.filter((e) => e.type === "text" && e.role === "body" && e.y > 180 && e.y < BOTTOM - 80).sort((a, b) => a.y - b.y)[0];
  const image = els.filter((e) => e.type === "image").sort((a, b) => b.w * b.h - a.w * a.h)[0];
  const imgPos = imgPosOverride ?? slide.imgPos ?? "base";

  const startY = pill ? Math.max(pill.y + (pill.h ?? 64) + 26, 230) : 230;
  if (headline) headline.h = estTextH(headline.text ?? "", headline.fontSize ?? 52, headline.lineHeight ?? 1.1, headline.w, headline.uppercase);
  if (body) body.h = estTextH(body.text ?? "", body.fontSize ?? 32, body.lineHeight ?? 1.5, body.w);

  if (image && imgPos === "top") {
    let y = startY;
    image.y = y; y += image.h + 40;
    if (headline) { headline.y = y; y += headline.h + 20; }
    if (body) body.y = y;
  } else {
    let y = startY;
    if (headline) { headline.y = y; y += headline.h + 20; }
    if (body) { body.y = y; y += body.h + 30; }
    if (image) image.y = BOTTOM - image.h;
  }
  return els;
}

/** cor de texto legível (branco/escuro) sobre um fundo hex, por luminância. */
function readableOn(bg: string): string {
  const h = bg.replace("#", "");
  if (h.length < 6) return "#ffffff";
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#181026" : "#ffffff";
}

/**
 * Alterna a cor de fundo dos slides (estilo MyPostFlow): slides ímpares (2,4,6…)
 * recebem `colorB`; a capa e os pares mantêm o look do modelo. Mutação in-place.
 */
export function applyAlternating(slides: Slide[], colorB: string, accent?: string): void {
  const text = readableOn(colorB);
  slides.forEach((s, i) => {
    if (i % 2 === 1) s.colors = { locked: false, bg: colorB, text, accent };
  });
}

export const CANVAS = { W: CANVAS_W, H: CANVAS_H };
