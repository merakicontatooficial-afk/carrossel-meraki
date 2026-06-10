import type { BrandKit, ColorToken, FontRole, Slide } from "../types";

// Stacks CSS reais das fontes empacotadas via @fontsource
const FONT_STACKS: Record<string, string> = {
  Fraunces: '"Fraunces", Georgia, serif',
  Syne: '"Syne", system-ui, sans-serif',
  "DM Sans": '"DM Sans", system-ui, sans-serif',
  "Space Mono": '"Space Mono", ui-monospace, monospace',
  Poppins: '"Poppins", system-ui, sans-serif',
  Inter: '"Inter", system-ui, sans-serif',
};

export const AVAILABLE_FONTS = Object.keys(FONT_STACKS);

export function fontStack(name: string): string {
  return FONT_STACKS[name] ?? `"${name}", sans-serif`;
}

export function resolveFont(role: FontRole | undefined, kit: BrandKit): string {
  const name =
    role === "display"
      ? kit.fontDisplay
      : role === "label"
        ? kit.fontLabel
        : kit.fontBody;
  return fontStack(name);
}

/** Paleta efetiva do slide: kit + overrides destravados por slide */
export function effectiveColors(slide: Slide, kit: BrandKit) {
  const unlocked = !slide.colors.locked;
  return {
    bg: (unlocked && slide.colors.bg) || kit.bg,
    text: (unlocked && slide.colors.text) || kit.text,
    accent: (unlocked && slide.colors.accent) || kit.accent,
    surface: kit.surface,
    muted: kit.muted,
  };
}

/** Token da marca → cor concreta; hex/css literal passa direto. */
export function resolveColor(
  token: ColorToken | undefined,
  slide: Slide,
  kit: BrandKit,
  fallback: string
): string {
  if (!token) return fallback;
  const pal = effectiveColors(slide, kit);
  switch (token) {
    case "accent":
      return pal.accent;
    case "text":
      return pal.text;
    case "bg":
      return pal.bg;
    case "surface":
      return pal.surface;
    case "muted":
      return pal.muted;
    default:
      return token; // hex/css literal — escolha manual do usuário permanece
  }
}

export function isToken(value: ColorToken | undefined): boolean {
  return (
    value === "accent" ||
    value === "text" ||
    value === "bg" ||
    value === "surface" ||
    value === "muted"
  );
}
