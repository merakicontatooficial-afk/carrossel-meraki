import type { Element, Slide, SlideKind } from "../types";
import { uid, CANVAS_W, SAFE_MARGIN } from "../types";

// ---------------------------------------------------------------------------
// Estruturas virais na linhagem MyPostFlow (refs/ na raiz do projeto):
// pílula de @handle no topo do bloco, headline grotesca em CAIXA ALTA com
// *acento* / ==realce==, foto full-bleed com scrim OU card de mídia, corpo curto.
// Compartilhadas entre marcas — cores via tokens, fontes via fontRole.
// ---------------------------------------------------------------------------

const M = SAFE_MARGIN; // 80
const W = CANVAS_W - 2 * M; // 920

function el(partial: Partial<Element> & Pick<Element, "type">): Element {
  return { id: uid(), x: M, y: 0, w: W, h: 100, z: 10, ...partial };
}

function slide(kind: SlideKind, elements: Element[], extra?: Partial<Slide>): Slide {
  return {
    id: uid("sl"),
    kind,
    elements,
    bg: "bg",
    colors: { locked: true },
    ...extra,
  };
}

// --- peças ------------------------------------------------------------------

const handlePill = (y: number, align: "left" | "center" = "left") =>
  el({
    type: "text",
    role: "eyebrow",
    text: "",
    fontRole: "label",
    fontSize: 30,
    fontWeight: 600,
    align,
    color: "text",
    y,
    h: 70,
    z: 20,
  });

const headline = (o: {
  text: string;
  y: number;
  size?: number;
  align?: "left" | "center";
  h?: number;
}) =>
  el({
    type: "text",
    role: "headline",
    text: o.text,
    fontRole: "display",
    fontSize: o.size ?? 76,
    fontWeight: 800,
    lineHeight: 1.06,
    letterSpacing: -1,
    uppercase: true,
    align: o.align ?? "left",
    color: "text",
    y: o.y,
    h: o.h ?? 300,
    z: 20,
  });

const body = (o: { text: string; y: number; align?: "left" | "center"; h?: number; size?: number }) =>
  el({
    type: "text",
    role: "body",
    text: o.text,
    fontRole: "body",
    fontSize: o.size ?? 38,
    fontWeight: 400,
    lineHeight: 1.45,
    align: o.align ?? "left",
    color: "muted",
    y: o.y,
    h: o.h ?? 200,
    z: 20,
  });

const mediaCard = (o: { y: number; h: number }) =>
  el({
    type: "image",
    src: undefined,
    fit: "cover",
    radius: 28,
    shadow: true,
    y: o.y,
    h: o.h,
    z: 15,
  });

// "Arraste →" discreto no canto (variante minimalista; trocável por pílula no editor).
const swipeNudge = () =>
  el({
    type: "text",
    role: "cta-secondary",
    text: "Arraste →",
    fontRole: "label",
    fontSize: 28,
    fontWeight: 600,
    align: "right",
    color: "text",
    ctaVariant: "text",
    x: CANVAS_W - M - 360,
    w: 360,
    y: 1262,
    h: 50,
    z: 20,
  });

// Barra de ícones do Instagram (curtir/comentar/salvar/enviar) — fecho de salvamento.
const socialBar = (y: number) =>
  el({ type: "social", x: M, y, w: W, h: 90, z: 20, color: "text", gap: 56, align: "left" });

const logoBlock = (o: { y: number; align?: "left" | "center"; size?: number }) =>
  el({
    type: "text",
    role: "logo",
    text: "",
    fontRole: "label",
    fontSize: o.size ?? 28,
    fontWeight: 700,
    letterSpacing: 1,
    align: o.align ?? "center",
    color: "text",
    y: o.y,
    h: 70,
    z: 20,
  });

// --- fábricas de slide -------------------------------------------------------

/** Capa estilo foto viral: texto ancorado embaixo, foto full-bleed (com scrim). */
function coverFoto(o: { headline: string; sub: string }): Slide {
  return slide(
    "cover",
    [
      handlePill(690),
      headline({ text: o.headline, y: 790, size: 70, h: 320 }),
      body({ text: o.sub, y: 1120, h: 120 }),
      swipeNudge(),
    ],
    { scrim: 68 }
  );
}

/** Conteúdo sobre foto full-bleed: mesma anatomia da capa, headline menor. */
function valueFoto(o: { headline: string; body: string }): Slide {
  return slide(
    "value",
    [
      handlePill(740),
      headline({ text: o.headline, y: 840, size: 60, h: 250 }),
      body({ text: o.body, y: 1110, h: 150 }),
    ],
    { scrim: 68 }
  );
}

/** Texto no topo + card de mídia embaixo (estilo editorial claro). */
function valueCard(o: { headline: string; body: string }): Slide {
  return slide("value", [
    handlePill(96),
    headline({ text: o.headline, y: 195, size: 64, h: 240 }),
    body({ text: o.body, y: 450, h: 210 }),
    mediaCard({ y: 700, h: 554 }),
  ]);
}

/** Card de mídia no topo + texto embaixo. */
function valueCardTop(o: { headline: string; body: string }): Slide {
  return slide("value", [
    mediaCard({ y: 96, h: 520 }),
    handlePill(670),
    headline({ text: o.headline, y: 765, size: 64, h: 240 }),
    body({ text: o.body, y: 1015, h: 240 }),
  ]);
}

/** Prova/citação: barra de acento + frase grande. */
function proofSlide(o: { quote: string; source: string }): Slide {
  return slide("proof", [
    el({ type: "shape", shape: "rect", fill: "accent", x: M, y: 300, w: 16, h: 480, radius2: 8, z: 5 }),
    handlePill(96),
    el({
      type: "text",
      role: "headline",
      text: o.quote,
      fontRole: "display",
      fontSize: 58,
      fontWeight: 800,
      lineHeight: 1.18,
      align: "left",
      color: "text",
      x: M + 64,
      w: W - 64,
      y: 310,
      h: 460,
      z: 20,
    }),
    el({
      type: "text",
      role: "body",
      text: o.source,
      fontRole: "label",
      fontSize: 32,
      fontWeight: 600,
      align: "left",
      color: "muted",
      x: M + 64,
      w: W - 64,
      y: 800,
      h: 80,
      z: 20,
    }),
  ]);
}

/** CTA centrado, text-only (estilo "CRIE CONTEÚDO VIRAL AGORA!"). */
function ctaSlide(o: { headline: string; sub: string; primary: string; secondary: string }): Slide {
  return slide("cta", [
    handlePill(240, "center"),
    headline({ text: o.headline, y: 360, size: 64, align: "center", h: 300 }),
    body({ text: o.sub, y: 680, align: "center", h: 120 }),
    el({
      type: "text",
      role: "cta-primary",
      text: o.primary,
      fontRole: "body",
      fontSize: 40,
      fontWeight: 700,
      align: "center",
      color: "bg",
      x: 240,
      w: 600,
      y: 850,
      h: 110,
      z: 20,
    }),
    el({
      type: "text",
      role: "cta-secondary",
      text: o.secondary,
      fontRole: "body",
      fontSize: 34,
      fontWeight: 600,
      align: "center",
      color: "accent",
      x: 240,
      w: 600,
      y: 1000,
      h: 100,
      z: 20,
    }),
    el({
      type: "text",
      role: "logo",
      text: "",
      fontRole: "label",
      fontSize: 28,
      fontWeight: 700,
      letterSpacing: 1,
      align: "center",
      color: "muted",
      y: 1210,
      h: 60,
      z: 20,
    }),
  ]);
}

/** Slide de salvamento padrão (ref G2D): logo, "Gostou desse conteúdo?", pílula salvar + barra social. */
function saveSlide(): Slide {
  return slide("cta", [
    logoBlock({ y: 150, align: "center", size: 34 }),
    el({
      type: "text",
      role: "eyebrow",
      text: "Obrigado por chegar até aqui",
      fontRole: "body",
      fontSize: 34,
      fontWeight: 400,
      align: "center",
      color: "muted",
      y: 300,
      h: 60,
      z: 20,
    }),
    { ...headline({ text: "Gostou desse *conteúdo*?", y: 400, size: 88, align: "center", h: 360 }), uppercase: false, letterSpacing: -2 },
    el({
      type: "text",
      role: "cta-primary",
      text: "Salve para não esquecer!",
      fontRole: "body",
      fontSize: 40,
      fontWeight: 700,
      align: "center",
      color: "bg",
      ctaVariant: "soft",
      ctaIcon: "bookmark",
      x: 150,
      w: 780,
      y: 800,
      h: 108,
      z: 20,
    }),
    socialBar(1010),
  ]);
}

/** Slide de CTA por comentário (ref G2D img1): headline + bullets + "Comenta EU QUERO" + botão. */
function commentCtaSlide(o: {
  headline: string;
  body: string;
  bullets: [string, string, string];
  comment: string;
  button: string;
}): Slide {
  const bulletEl = (text: string, y: number) =>
    el({
      type: "text",
      role: "body",
      text,
      fontRole: "body",
      fontSize: 40,
      fontWeight: 600,
      align: "left",
      color: "text",
      x: M + 70,
      w: W - 70,
      y,
      h: 70,
      z: 20,
    });
  return slide("cta", [
    { ...headline({ text: o.headline, y: 110, size: 62, h: 220 }), uppercase: false, letterSpacing: -1 },
    body({ text: o.body, y: 340, h: 200, size: 38 }),
    // marcadores com bolinha de acento
    el({ type: "shape", shape: "rect", fill: "accent", x: M, y: 612, w: 26, h: 26, radius2: 13, z: 21 }),
    bulletEl(o.bullets[0], 600),
    el({ type: "shape", shape: "rect", fill: "accent", x: M, y: 712, w: 26, h: 26, radius2: 13, z: 21 }),
    bulletEl(o.bullets[1], 700),
    el({ type: "shape", shape: "rect", fill: "accent", x: M, y: 812, w: 26, h: 26, radius2: 13, z: 21 }),
    bulletEl(o.bullets[2], 800),
    el({
      type: "text",
      role: "body",
      text: o.comment,
      fontRole: "display",
      fontSize: 40,
      fontWeight: 800,
      align: "center",
      color: "text",
      uppercase: false,
      y: 930,
      h: 150,
      z: 20,
    }),
    el({
      type: "text",
      role: "cta-primary",
      text: o.button,
      fontRole: "body",
      fontSize: 40,
      fontWeight: 700,
      align: "center",
      color: "bg",
      ctaVariant: "solid",
      ctaIcon: "chat",
      x: 270,
      w: 540,
      y: 1120,
      h: 108,
      z: 20,
    }),
  ]);
}

// --- estruturas ---------------------------------------------------------------

export type DefaultKit = "livre-escuro" | "livre-claro";

export interface Structure {
  id: string;
  name: string;
  framework: string;
  description: string;
  defaultKit: DefaultKit;
  build: () => Slide[];
}

export const STRUCTURES: Structure[] = [
  {
    id: "viral_foto",
    name: "Foto viral (full-bleed)",
    framework: "cover(foto) → 4× value(foto) → comenta → salvar",
    description:
      "Linhagem MyPostFlow escura: foto cinematográfica de fundo em cada slide, scrim e texto ancorado embaixo. Suba uma foto por slide.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "O ==segredo== dos posts que crescem",
        sub: "Ninguém te contou isso ainda. Arraste e veja por quê.",
      }),
      valueFoto({
        headline: "Não é sorte. É *estrutura*",
        body: "Todo post viral segue um esqueleto: gancho, valor, chamada.",
      }),
      valueFoto({
        headline: "O gancho decide ==tudo==",
        body: "1 segundo no scroll. A primeira frase compra os outros 9 slides.",
      }),
      valueFoto({
        headline: "Uma ideia por *slide*",
        body: "Slide carregado é slide pulado. Corte até doer.",
      }),
      valueFoto({
        headline: "Feche pedindo ==ação==",
        body: "Salvar, enviar, comentar. Quem não pede, não recebe.",
      }),
      commentCtaSlide({
        headline: "É aqui que entra a *sua oferta*",
        body: "A gente te ajuda a estruturar conteúdo que cresce de verdade.",
        bullets: ["Estratégia por formato", "Gestão de indicadores", "Estrutura operacional"],
        comment: "Comenta ==EU QUERO== aqui embaixo",
        button: "Comenta aqui!",
      }),
      saveSlide(),
    ],
  },
  {
    id: "caso_claro",
    name: "Editorial claro (case)",
    framework: "cover → 3× value(card) → cta → salvar",
    description:
      "Linhagem MyPostFlow clara: fundo branco, headline preta com *acento*, cards de foto arredondados.",
    defaultKit: "livre-claro",
    build: () => [
      slide("cover", [
        handlePill(96),
        headline({ text: "Como eles conseguiram esse resultado ~do nada~?", y: 195, size: 72, h: 330 }),
        body({ text: "O bastidor completo da estratégia, slide por slide.", y: 540, h: 120 }),
        mediaCard({ y: 700, h: 554 }),
        swipeNudge(),
      ]),
      valueCardTop({
        headline: "Mais que produto, é *narrativa*",
        body: "Eles não venderam o item. Venderam a história em volta dele — e a audiência se viu nela.",
      }),
      valueCard({
        headline: "De buzz a conexão ==eterna==",
        body: "A campanha transformou consumidores em embaixadores leais. Marketing que entende gera paixão.",
      }),
      valueCardTop({
        headline: "Uma construção de marca *incrível*",
        body: "Réplicas, colaborações e experiências que provam: relação duradoura vale mais que venda rápida.",
      }),
      ctaSlide({
        headline: "Crie conteúdo viral *agora*",
        sub: "Todo esse formato você monta em minutos — sem designer.",
        primary: "Salve este case 📌",
        secondary: "Siga pra mais análises",
      }),
      saveSlide(),
    ],
  },
  {
    id: "lista",
    name: "Lista / Educacional",
    framework: "cover → 4× value → cta → salvar",
    description: "Hook na capa, 4 itens de valor, CTA duplo.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "4 erros que ==travam== seu perfil",
        sub: "E como corrigir cada um hoje, sem gastar nada.",
      }),
      valueCard({
        headline: "Bio que não *vende*",
        body: "Sua bio precisa dizer o que você faz e pra quem em ==5 segundos==.",
      }),
      valueCardTop({
        headline: "Feed sem *padrão*",
        body: "Identidade visual consistente faz o seguidor reconhecer você no scroll.",
      }),
      valueCard({
        headline: "Postar sem *estratégia*",
        body: "Frequência sem direção cansa. Planeje temas antes de planejar posts.",
      }),
      valueFoto({
        headline: "Ignorar os ==dados==",
        body: "Os insights mostram o que repetir e o que abandonar. Olhe toda semana.",
      }),
      ctaSlide({
        headline: "Qual desses você corrige *primeiro*?",
        sub: "Escolhe um e ataca essa semana.",
        primary: "Salve este post 📌",
        secondary: "Envie pra quem precisa ver isso",
      }),
      saveSlide(),
    ],
  },
  {
    id: "pas",
    name: "Problema → Solução → Prova",
    framework: "cover(dor) → value → value → proof → cta → salvar",
    description: "Abre na dor, explica a causa, mostra a virada e prova com resultado.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "Seu perfil não cresce por *um* motivo",
        sub: "E não é o algoritmo. Arraste pra entender.",
      }),
      valueFoto({
        headline: "O problema *real*",
        body: "Você posta pra todo mundo — e por isso não fala com ==ninguém==.",
      }),
      valueCard({
        headline: "A *virada*",
        body: "Escolha uma pessoa, uma dor, uma promessa. Todo post nasce daí.",
      }),
      proofSlide({
        quote: "“Em 60 dias o engajamento *triplicou* — só mudando o foco do conteúdo.”",
        source: "— CLIENTE ATENDIDO PELA AGÊNCIA",
      }),
      ctaSlide({
        headline: "Pronto pra focar de *verdade*?",
        sub: "Um público, uma promessa, um post de cada vez.",
        primary: "Salve pra não esquecer 📌",
        secondary: "Comenta “FOCO” que a gente te ajuda",
      }),
      saveSlide(),
    ],
  },
  {
    id: "tutorial",
    name: "Passo a passo",
    framework: "cover → 3× value(passos) → cta → salvar",
    description: "Promessa na capa e três passos práticos.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "Stories que ==vendem== em 3 passos",
        sub: "O roteiro simples que funciona todo dia.",
      }),
      valueCard({
        headline: "Passo 1 — *Gancho*",
        body: "Primeiro story responde: por que assistir até o fim?",
      }),
      valueCardTop({
        headline: "Passo 2 — *Valor*",
        body: "Mostre o bastidor, o antes e depois, a prova. Sem enrolar.",
      }),
      valueCard({
        headline: "Passo 3 — *Chamada*",
        body: "Feche com uma ação única: responder caixinha, salvar, chamar no direct.",
      }),
      ctaSlide({
        headline: "Testa *hoje* e me conta",
        sub: "Roteiro simples vence roteiro perfeito.",
        primary: "Salve o roteiro 📌",
        secondary: "Siga pra mais conteúdo assim",
      }),
      saveSlide(),
    ],
  },
  {
    id: "antes_depois",
    name: "Antes / Depois",
    framework: "cover → antes → depois → como → cta → salvar",
    description: "Contraste entre o antes e o depois, com o caminho no meio.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "O perfil antes e ==depois== da estratégia",
        sub: "A diferença que 30 dias de método fazem.",
      }),
      valueCardTop({
        headline: "O ~antes~",
        body: "Posts soltos, feed sem identidade, alcance parado há meses.",
      }),
      valueCardTop({
        headline: "O *depois*",
        body: "Linha editorial clara, identidade forte e alcance ==crescendo==.",
      }),
      valueCard({
        headline: "Como chegamos *lá*",
        body: "Diagnóstico, planejamento mensal e constância. Nessa ordem.",
      }),
      ctaSlide({
        headline: "Quer essa virada no *seu* perfil?",
        sub: "O método é replicável. O primeiro passo é seu.",
        primary: "Salve este post 📌",
        secondary: "Envie pra um amigo que precisa",
      }),
      saveSlide(),
    ],
  },
  {
    id: "historia",
    name: "História / Autoridade",
    framework: "cover(verdade) → história → lição → cta → salvar",
    description: "Verdade contraintuitiva, micro-história e a lição extraída.",
    defaultKit: "livre-escuro",
    build: () => [
      coverFoto({
        headline: "Postar ==menos== fez a gente crescer mais",
        sub: "A história real por trás dessa decisão.",
      }),
      valueFoto({
        headline: "A *história*",
        body: "Cortamos de 20 pra 8 posts no mês. Medo? Total. Resultado? Surpresa.",
      }),
      valueCard({
        headline: "A *lição*",
        body: "Qualidade concentra atenção. Volume sem direção ==dilui== a marca.",
      }),
      ctaSlide({
        headline: "Menos posts, mais *intenção*",
        sub: "Teste por 30 dias e compare os números.",
        primary: "Salve essa ideia 📌",
        secondary: "Siga pra mais bastidores",
      }),
      saveSlide(),
    ],
  },
  {
    id: "livre",
    name: "Livre (em branco)",
    framework: "1 slide vazio — monte do zero",
    description: "Um slide com o básico (handle, headline, corpo) pra você criar seu próprio estilo no modo manual.",
    defaultKit: "livre-escuro",
    build: () => [
      slide("value", [
        handlePill(96),
        headline({ text: "Sua ideia *aqui*", y: 500, size: 80, h: 320 }),
        body({ text: "Edite tudo no modo manual: adicione textos, fotos, formas — e salve como template.", y: 830, h: 200 }),
      ]),
    ],
  },
];

export function getStructure(id: string): Structure {
  return STRUCTURES.find((s) => s.id === id) ?? STRUCTURES[0];
}

export function structureDefaultKit(id: string): DefaultKit {
  return getStructure(id).defaultKit;
}
