import type { Element, Slide, SlideKind } from "../types";
import { uid, CANVAS_W, SAFE_MARGIN } from "../types";

// ---------------------------------------------------------------------------
// Estruturas virais = esqueletos de slides com elementos de papel semântico.
// Compartilhadas entre marcas: cores entram como tokens, fontes como fontRole.
// ---------------------------------------------------------------------------

const M = SAFE_MARGIN; // 80
const W = CANVAS_W - 2 * M; // 920

function el(partial: Partial<Element> & Pick<Element, "type">): Element {
  return { id: uid(), x: M, y: 0, w: W, h: 100, z: 10, ...partial };
}

function slide(kind: SlideKind, elements: Element[]): Slide {
  return {
    id: uid("sl"),
    kind,
    elements,
    bg: "bg",
    colors: { locked: true },
  };
}

// --- fábricas de slide ------------------------------------------------------

function coverSlide(o: { eyebrow: string; headline: string; sub: string }): Slide {
  return slide("cover", [
    el({
      type: "text",
      role: "eyebrow",
      text: o.eyebrow,
      fontRole: "label",
      fontSize: 30,
      fontWeight: 400,
      letterSpacing: 3,
      align: "left",
      color: "accent",
      y: 110,
      h: 70,
      z: 20,
    }),
    el({
      type: "text",
      role: "headline",
      text: o.headline,
      fontRole: "display",
      fontSize: 96,
      fontWeight: 700,
      lineHeight: 1.08,
      align: "left",
      color: "text",
      y: 430,
      h: 430,
      z: 20,
    }),
    el({
      type: "text",
      role: "body",
      text: o.sub,
      fontRole: "body",
      fontSize: 40,
      fontWeight: 400,
      lineHeight: 1.4,
      align: "left",
      color: "muted",
      y: 900,
      h: 160,
      z: 20,
    }),
    el({
      type: "text",
      role: "cta-secondary",
      text: "Arraste →",
      fontRole: "label",
      fontSize: 30,
      fontWeight: 400,
      letterSpacing: 1,
      align: "right",
      color: "accent",
      x: CANVAS_W - M - 360,
      w: 360,
      y: 1210,
      h: 60,
      z: 20,
    }),
    el({
      type: "text",
      role: "logo",
      text: "",
      fontRole: "label",
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: 2,
      align: "left",
      color: "text",
      y: 1210,
      w: 500,
      h: 60,
      z: 20,
    }),
  ]);
}

function valueSlide(o: {
  index: number;
  headline: string;
  body: string;
  withMedia?: boolean;
}): Slide {
  const idx = String(o.index).padStart(2, "0");
  const els: Element[] = [
    el({
      type: "shape",
      shape: "line",
      fill: "accent",
      y: 130,
      x: M,
      w: 120,
      h: 10,
      z: 5,
    }),
    el({
      type: "text",
      role: "index",
      text: idx,
      fontRole: "display",
      fontSize: 64,
      fontWeight: 700,
      align: "right",
      color: "accent",
      x: CANVAS_W - M - 200,
      w: 200,
      y: 96,
      h: 90,
      z: 20,
    }),
    el({
      type: "text",
      role: "headline",
      text: o.headline,
      fontRole: "display",
      fontSize: 68,
      fontWeight: 600,
      lineHeight: 1.12,
      align: "left",
      color: "text",
      y: 280,
      h: 280,
      z: 20,
    }),
    el({
      type: "text",
      role: "body",
      text: o.body,
      fontRole: "body",
      fontSize: 44,
      fontWeight: 400,
      lineHeight: 1.45,
      align: "left",
      color: "text",
      y: 600,
      h: 280,
      z: 20,
    }),
  ];
  if (o.withMedia) {
    els.push(
      el({
        type: "image",
        src: undefined,
        fit: "cover",
        radius: 32,
        shadow: true,
        y: 920,
        h: 330,
        z: 15,
      })
    );
  } else {
    els.push(
      el({
        type: "text",
        role: "logo",
        text: "",
        fontRole: "label",
        fontSize: 28,
        fontWeight: 700,
        letterSpacing: 2,
        align: "left",
        color: "muted",
        y: 1210,
        w: 500,
        h: 60,
        z: 20,
      })
    );
  }
  return slide("value", els);
}

function proofSlide(o: { index: number; quote: string; source: string }): Slide {
  const idx = String(o.index).padStart(2, "0");
  return slide("proof", [
    el({
      type: "shape",
      shape: "rect",
      fill: "accent",
      x: M,
      y: 280,
      w: 14,
      h: 560,
      radius2: 7,
      z: 5,
    }),
    el({
      type: "text",
      role: "index",
      text: idx,
      fontRole: "display",
      fontSize: 64,
      fontWeight: 700,
      align: "right",
      color: "accent",
      x: CANVAS_W - M - 200,
      w: 200,
      y: 96,
      h: 90,
      z: 20,
    }),
    el({
      type: "text",
      role: "headline",
      text: o.quote,
      fontRole: "display",
      fontSize: 60,
      fontWeight: 600,
      lineHeight: 1.25,
      align: "left",
      color: "text",
      x: M + 60,
      w: W - 60,
      y: 300,
      h: 500,
      z: 20,
    }),
    el({
      type: "text",
      role: "body",
      text: o.source,
      fontRole: "label",
      fontSize: 32,
      fontWeight: 400,
      letterSpacing: 1,
      align: "left",
      color: "muted",
      x: M + 60,
      w: W - 60,
      y: 850,
      h: 80,
      z: 20,
    }),
    el({
      type: "text",
      role: "logo",
      text: "",
      fontRole: "label",
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: 2,
      align: "left",
      color: "muted",
      y: 1210,
      w: 500,
      h: 60,
      z: 20,
    }),
  ]);
}

function ctaSlide(o: { headline: string; primary: string; secondary: string }): Slide {
  return slide("cta", [
    el({
      type: "text",
      role: "headline",
      text: o.headline,
      fontRole: "display",
      fontSize: 80,
      fontWeight: 700,
      lineHeight: 1.1,
      align: "center",
      color: "text",
      y: 300,
      h: 360,
      z: 20,
    }),
    el({
      type: "text",
      role: "cta-primary",
      text: o.primary,
      fontRole: "body",
      fontSize: 40,
      fontWeight: 600,
      align: "center",
      color: "bg",
      x: 240,
      w: 600,
      y: 740,
      h: 110,
      z: 20,
    }),
    el({
      type: "text",
      role: "cta-secondary",
      text: o.secondary,
      fontRole: "body",
      fontSize: 36,
      fontWeight: 500,
      align: "center",
      color: "accent",
      x: 240,
      w: 600,
      y: 890,
      h: 100,
      z: 20,
    }),
    el({
      type: "text",
      role: "logo",
      text: "",
      fontRole: "label",
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: 2,
      align: "center",
      color: "text",
      y: 1180,
      h: 60,
      z: 20,
    }),
  ]);
}

// --- estruturas -------------------------------------------------------------

export interface Structure {
  id: string;
  name: string;
  framework: string;
  description: string;
  build: () => Slide[];
}

export const STRUCTURES: Structure[] = [
  {
    id: "lista",
    name: "Lista / Educacional",
    framework: "cover → 4× value → cta",
    description: "Hook na capa, 4 itens de valor numerados, CTA duplo.",
    build: () => [
      coverSlide({
        eyebrow: "GUIA RÁPIDO",
        headline: "4 erros que *travam* seu perfil",
        sub: "E como corrigir cada um _hoje_, sem gastar nada.",
      }),
      valueSlide({
        index: 1,
        headline: "Bio que não *vende*",
        body: "Sua bio precisa dizer o que você faz e pra quem em ==5 segundos==.",
      }),
      valueSlide({
        index: 2,
        headline: "Feed sem *padrão*",
        body: "Identidade visual consistente faz o seguidor reconhecer você no scroll.",
        withMedia: true,
      }),
      valueSlide({
        index: 3,
        headline: "Postar sem *estratégia*",
        body: "Frequência sem direção cansa. Planeje temas antes de planejar posts.",
      }),
      valueSlide({
        index: 4,
        headline: "Ignorar os *dados*",
        body: "Os insights mostram o que repetir e o que abandonar. Olhe toda semana.",
      }),
      ctaSlide({
        headline: "Qual desses você vai corrigir *primeiro*?",
        primary: "Salve este post 📌",
        secondary: "Envie pra quem precisa ver isso",
      }),
    ],
  },
  {
    id: "pas",
    name: "Problema → Solução → Prova",
    framework: "cover(dor) → value(por quê) → value(virada) → proof → cta",
    description: "Abre na dor, explica a causa, mostra a virada e prova com resultado.",
    build: () => [
      coverSlide({
        eyebrow: "A VERDADE",
        headline: "Seu perfil não cresce por *um* motivo",
        sub: "E não é o algoritmo. Arraste pra entender.",
      }),
      valueSlide({
        index: 1,
        headline: "O problema *real*",
        body: "Você posta pra todo mundo — e por isso não fala com ==ninguém==.",
      }),
      valueSlide({
        index: 2,
        headline: "A *virada*",
        body: "Escolha uma pessoa, uma dor, uma promessa. Todo post nasce daí.",
      }),
      proofSlide({
        index: 3,
        quote: "“Em 60 dias o engajamento _triplicou_ — só mudando o foco do conteúdo.”",
        source: "— Cliente atendido pela agência",
      }),
      ctaSlide({
        headline: "Pronto pra *focar* de verdade?",
        primary: "Salve pra não esquecer 📌",
        secondary: "Comenta “FOCO” que a gente te ajuda",
      }),
    ],
  },
  {
    id: "tutorial",
    name: "Passo a passo",
    framework: "cover → 3× value(passos) → cta",
    description: "Promessa na capa e três passos práticos numerados.",
    build: () => [
      coverSlide({
        eyebrow: "TUTORIAL",
        headline: "Faça *stories* que vendem em 3 passos",
        sub: "O roteiro simples que funciona todo dia.",
      }),
      valueSlide({
        index: 1,
        headline: "Passo 1 — *Gancho*",
        body: "Primeiro story responde: por que assistir até o fim?",
      }),
      valueSlide({
        index: 2,
        headline: "Passo 2 — *Valor*",
        body: "Mostre o bastidor, o antes e depois, a prova. Sem enrolar.",
        withMedia: true,
      }),
      valueSlide({
        index: 3,
        headline: "Passo 3 — *Chamada*",
        body: "Feche com uma ação única: responder caixinha, salvar, chamar no direct.",
      }),
      ctaSlide({
        headline: "Testa *hoje* e me conta o resultado",
        primary: "Salve o roteiro 📌",
        secondary: "Siga pra mais conteúdo assim",
      }),
    ],
  },
  {
    id: "antes_depois",
    name: "Antes / Depois",
    framework: "cover → value(antes) → value(depois) → value(como) → cta",
    description: "Contraste visual entre o antes e o depois, com o caminho no meio.",
    build: () => [
      coverSlide({
        eyebrow: "TRANSFORMAÇÃO",
        headline: "O perfil *antes* e *depois* da estratégia",
        sub: "A diferença que 30 dias de método fazem.",
      }),
      valueSlide({
        index: 1,
        headline: "O *antes*",
        body: "Posts soltos, feed sem identidade, alcance parado há meses.",
        withMedia: true,
      }),
      valueSlide({
        index: 2,
        headline: "O *depois*",
        body: "Linha editorial clara, identidade forte e alcance ==crescendo==.",
        withMedia: true,
      }),
      valueSlide({
        index: 3,
        headline: "Como *chegamos* lá",
        body: "Diagnóstico, planejamento mensal e constância. Nessa ordem.",
      }),
      ctaSlide({
        headline: "Quer essa virada no *seu* perfil?",
        primary: "Salve este post 📌",
        secondary: "Envie pra um amigo que precisa",
      }),
    ],
  },
  {
    id: "historia",
    name: "História / Autoridade",
    framework: "cover(verdade contraintuitiva) → value(micro-história) → value(lição) → cta",
    description: "Verdade contraintuitiva, micro-história pessoal e a lição extraída.",
    build: () => [
      coverSlide({
        eyebrow: "BASTIDOR",
        headline: "Postar *menos* fez a gente crescer mais",
        sub: "A história real por trás dessa decisão.",
      }),
      valueSlide({
        index: 1,
        headline: "A *história*",
        body: "Cortamos de 20 pra 8 posts no mês. Medo? Total. Resultado? Surpresa.",
      }),
      valueSlide({
        index: 2,
        headline: "A *lição*",
        body: "Qualidade concentra atenção. Volume sem direção ==dilui== a marca.",
      }),
      ctaSlide({
        headline: "Menos posts, mais *intenção*",
        primary: "Salve essa ideia 📌",
        secondary: "Siga pra mais bastidores",
      }),
    ],
  },
];

export function getStructure(id: string): Structure {
  return STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
}
