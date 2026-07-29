// Proporção pedida ao modelo de imagem. Sem isso a IA devolve o formato que quiser
// e a foto chega cortada no slide: o cartão é paisagem (920×520) e o fundo é 4:5.
import { CANVAS_W, CANVAS_H } from "../types";

/** As proporções que o Gemini aceita (mesma lista do servidor). */
const ASPECTOS: { nome: string; r: number }[] = [
  { nome: "1:1", r: 1 },
  { nome: "2:3", r: 2 / 3 },
  { nome: "3:2", r: 3 / 2 },
  { nome: "3:4", r: 3 / 4 },
  { nome: "4:3", r: 4 / 3 },
  { nome: "4:5", r: 4 / 5 },
  { nome: "5:4", r: 5 / 4 },
  { nome: "9:16", r: 9 / 16 },
  { nome: "16:9", r: 16 / 9 },
  { nome: "21:9", r: 21 / 9 },
];

const PADRAO = "4:5";

/** Proporção aceita mais próxima de w×h (comparada em log, pra não puxar pros extremos). */
export function aspectFromSize(w: number, h: number): string {
  if (!w || !h) return PADRAO;
  const alvo = Math.log(w / h);
  let melhor = ASPECTOS[0];
  for (const a of ASPECTOS) {
    if (Math.abs(Math.log(a.r) - alvo) < Math.abs(Math.log(melhor.r) - alvo)) melhor = a;
  }
  return melhor.nome;
}

/** Foto de fundo = o slide inteiro (1080×1350 → 4:5). */
export const ASPECTO_FUNDO = aspectFromSize(CANVAS_W, CANVAS_H);
