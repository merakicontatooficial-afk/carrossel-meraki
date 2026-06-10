import type { TextRole } from "../types";
import { stripMarkup } from "../lib/richtext";

// Limites de palavras por papel (contagem ignora marcação *…* _…_ ==…==)
export const WORD_LIMITS: Partial<Record<TextRole, number>> = {
  eyebrow: 4,
  headline: 8, // capa: 5–8 palavras; demais headlines também curtas
  body: 15, // 1 ideia por slide
  "cta-primary": 6,
  "cta-secondary": 6,
};

export const MIN_BODY_FONT = 40; // px no canvas 1080
export const SLIDE_COUNT_RANGE: [number, number] = [7, 10];

export function countWords(text: string): number {
  const clean = stripMarkup(text).trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

export interface TextCheck {
  count: number;
  limit: number | null;
  over: boolean;
}

export function checkText(role: TextRole | undefined, text: string): TextCheck {
  const limit = role ? (WORD_LIMITS[role] ?? null) : null;
  const count = countWords(text);
  return { count, limit, over: limit !== null && count > limit };
}
