import type { Element } from "../types";
import { CANVAS_W } from "../types";

export interface CtaPreset {
  id: string;
  label: string;
  patch: Partial<Element>;
}

// Botão de "passar o carrossel" (swipe) — capas. Geometria incluída pra ficar centrado.
export const SWIPE_PRESETS: CtaPreset[] = [
  {
    id: "text",
    label: "Texto · Arraste →",
    patch: { text: "Arraste →", ctaVariant: "text", ctaIcon: "none", align: "right", fontRole: "label", fontSize: 28, fontWeight: 600, x: CANVAS_W - 80 - 360, w: 360, h: 52 },
  },
  {
    id: "soft-side",
    label: "Pílula · Arrasta para o lado",
    patch: { text: "Arrasta para o lado e descubra!", ctaVariant: "soft", ctaIcon: "arrow-right", align: "center", fontRole: "body", fontSize: 30, fontWeight: 700, x: (CANVAS_W - 640) / 2, w: 640, h: 96 },
  },
  {
    id: "soft-legenda",
    label: "Pílula · Leia a legenda",
    patch: { text: "Leia a legenda", ctaVariant: "soft", ctaIcon: "arrow-down", align: "center", fontRole: "body", fontSize: 30, fontWeight: 700, x: (CANVAS_W - 440) / 2, w: 440, h: 96 },
  },
  {
    id: "solid-continua",
    label: "Sólido · Continua →",
    patch: { text: "Continua", ctaVariant: "solid", ctaIcon: "arrow-right", align: "center", fontRole: "body", fontSize: 30, fontWeight: 700, x: (CANVAS_W - 340) / 2, w: 340, h: 96 },
  },
];

// Botões de ação (cta principal) — comentar / salvar / enviar.
export const ACTION_PRESETS: CtaPreset[] = [
  { id: "solid-save", label: "Sólido · Salvar", patch: { ctaVariant: "solid", ctaIcon: "bookmark" } },
  { id: "soft-save", label: "Soft · Salvar", patch: { ctaVariant: "soft", ctaIcon: "bookmark" } },
  { id: "solid-chat", label: "Sólido · Comentar", patch: { ctaVariant: "solid", ctaIcon: "chat" } },
  { id: "soft-chat", label: "Soft · Comentar", patch: { ctaVariant: "soft", ctaIcon: "chat" } },
  { id: "solid-send", label: "Sólido · Enviar", patch: { ctaVariant: "solid", ctaIcon: "send" } },
  { id: "outline", label: "Contorno", patch: { ctaVariant: "outline", ctaIcon: "none" } },
];

/** Mantém o botão dentro do canvas após trocar pra uma pílula mais alta. */
export function clampCtaY(y: number, h: number): number {
  return Math.min(y, 1350 - h - 30);
}
