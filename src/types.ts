// Modelo de dados central — canvas lógico 1080×1350 (4:5)

export const CANVAS_W = 1080;
export const CANVAS_H = 1350;
export const SAFE_MARGIN = 80;

export type ElementType = "text" | "image" | "shape" | "social";

/** Token da marca ("accent" | "text" | "bg") OU hex literal escolhido manualmente */
export type ColorToken = "accent" | "text" | "bg" | string;

export type TextRole =
  | "eyebrow"
  | "headline"
  | "body"
  | "cta-primary"
  | "cta-secondary"
  | "index"
  | "logo";

export type FontRole = "display" | "body" | "label";

/** Ícone opcional dentro de um botão de CTA. */
export type CtaIcon =
  | "none"
  | "arrow-right"
  | "arrow-down"
  | "chat"
  | "bookmark"
  | "heart"
  | "send";

/** Aparência do botão de CTA. text = sem caixa (só texto + ícone). */
export type CtaVariant = "text" | "solid" | "soft" | "outline";

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  rotation?: number;
  // text
  role?: TextRole;
  text?: string; // aceita *destaque*, _sublinhado_ e ==realce==
  fontRole?: FontRole;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  align?: "left" | "center" | "right";
  uppercase?: boolean;
  color?: ColorToken;
  // cta (texto com role cta-*)
  ctaIcon?: CtaIcon;
  ctaVariant?: CtaVariant;
  // image
  src?: string;
  fit?: "cover" | "contain";
  radius?: number;
  shadow?: boolean;
  // shape
  shape?: "rect" | "line";
  fill?: ColorToken;
  radius2?: number;
  // social (barra de ícones do Instagram: curtir/comentar/salvar/enviar)
  gap?: number;
}

export interface SlideColors {
  locked: boolean;
  bg?: string;
  text?: string;
  accent?: string;
}

export type SlideKind = "cover" | "value" | "proof" | "cta";

export interface Slide {
  id: string;
  kind?: SlideKind;
  elements: Element[];
  bg?: ColorToken; // token = herda marca
  bgImage?: string; // dataURL opcional
  scrim?: number; // 0–100: gradiente escuro de baixo pra cima sobre o fundo (estilo viral)
  colors: SlideColors;
}

export interface BrandKit {
  id: string;
  name: string;
  locked: boolean;
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accent2?: string | null; // se definido, *destaque* vira gradiente accent→accent2
  glow?: string | null;
  fontDisplay: string;
  fontBody: string;
  fontLabel: string;
  logo: string;
  sub?: string;
  motif: "glow" | "badge" | "minimal";
  eyebrow: "pill-index" | "badge" | "minimal" | "handle";
  graphicAssets?: string[];
  note?: string;
}

export type LogoPosition = "tl" | "tr" | "bl" | "br";

export interface CarouselLogo {
  src: string | null;
  show: boolean;
  position: LogoPosition;
  scale?: number; // multiplicador do tamanho-base (1 = padrão; 0.4–2.5)
  everySlide?: boolean; // mostrar em todos os slides (default) ou só na capa
}

/** Faixas PNG decorativas fixas no topo e na base de todos os slides. */
export interface CarouselFrame {
  top: string | null;
  bottom: string | null;
  topH: number; // altura em px no canvas 1350
  bottomH: number;
}

export interface Carousel {
  id: string;
  name: string;
  templateId: string;
  kitId: string;
  logo: CarouselLogo;
  frame?: CarouselFrame;
  slides: Slide[];
  collectionId?: string;
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  framework: string;
  slides: Slide[];
  kit?: BrandKit; // snapshot do look (cores/fontes) — templates carregam o design completo
  logo?: CarouselLogo;
  frame?: CarouselFrame;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
}

let counter = 0;
export function uid(prefix = "el"): string {
  counter = (counter + 1) % 10000;
  return `${prefix}-${Date.now().toString(36)}-${counter}-${Math.random().toString(36).slice(2, 6)}`;
}
