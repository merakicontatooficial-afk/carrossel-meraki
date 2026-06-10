import type { ReactNode } from "react";

// Marcação leve nos textos:
//   *palavra*    → cor de acento
//   _palavra_    → itálico sublinhado no acento
//   ==palavra==  → bloco de realce atrás da palavra
const TOKEN_RE = /(\*[^*\n]+\*|_[^_\n]+_|==[^=\n]+==)/g;

export function stripMarkup(text: string): string {
  return text.replace(TOKEN_RE, (m) => {
    if (m.startsWith("==")) return m.slice(2, -2);
    return m.slice(1, -1);
  });
}

export interface RichOptions {
  accent: string;
  bg: string;
}

/** Converte texto com marcação em nodes React. Preserva quebras de linha. */
export function renderRich(text: string, opts: RichOptions): ReactNode[] {
  const out: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    if (li > 0) out.push(<br key={`br-${li}`} />);
    const parts = line.split(TOKEN_RE);
    parts.forEach((part, pi) => {
      if (!part) return;
      const key = `${li}-${pi}`;
      if (/^\*[^*\n]+\*$/.test(part)) {
        out.push(
          <span key={key} style={{ color: opts.accent }}>
            {part.slice(1, -1)}
          </span>
        );
      } else if (/^_[^_\n]+_$/.test(part)) {
        out.push(
          <span
            key={key}
            style={{
              fontStyle: "italic",
              textDecoration: "underline",
              textDecorationColor: opts.accent,
              textDecorationThickness: "0.06em",
              textUnderlineOffset: "0.12em",
            }}
          >
            {part.slice(1, -1)}
          </span>
        );
      } else if (/^==[^=\n]+==$/.test(part)) {
        out.push(
          <span
            key={key}
            style={{
              backgroundColor: opts.accent,
              color: opts.bg,
              padding: "0 0.15em",
              borderRadius: "0.12em",
              boxDecorationBreak: "clone",
              WebkitBoxDecorationBreak: "clone",
            }}
          >
            {part.slice(2, -2)}
          </span>
        );
      } else {
        out.push(part);
      }
    });
  });
  return out;
}
