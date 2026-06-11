import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { BrandKit, Carousel, CarouselLogo, Element, Slide } from "../types";
import { CANVAS_H, CANVAS_W, SAFE_MARGIN } from "../types";
import { effectiveColors, resolveColor, resolveFont } from "../lib/resolve";
import { renderRich } from "../lib/richtext";
import {
  ArrowDown,
  ArrowRight,
  Bookmark,
  Heart,
  ImageIcon,
  MessageCircle,
  Send,
} from "lucide-react";

const CTA_ICONS = {
  "arrow-right": ArrowRight,
  "arrow-down": ArrowDown,
  chat: MessageCircle,
  bookmark: Bookmark,
  heart: Heart,
  send: Send,
} as const;

export type CanvasMode = "edit" | "preview" | "export";

export interface InteractiveCtx {
  scale: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatch: (id: string, patch: Partial<Element>) => void;
}

interface SlideCanvasProps {
  slide: Slide;
  kit: BrandKit;
  carousel: Carousel;
  slideIndex: number;
  mode: CanvasMode;
  interactive?: InteractiveCtx;
}

// Linhas de snap: margens de segurança, centro e bordas
const GUIDES_V = [0, SAFE_MARGIN, CANVAS_W / 2, CANVAS_W - SAFE_MARGIN, CANVAS_W];
const GUIDES_H = [0, SAFE_MARGIN, CANVAS_H / 2, CANVAS_H - SAFE_MARGIN, CANVAS_H];

function snapTo(value: number, guides: number[], threshold: number): { value: number; guide: number | null } {
  for (const g of guides) {
    if (Math.abs(value - g) <= threshold) return { value: g, guide: g };
  }
  return { value, guide: null };
}

// ---------------------------------------------------------------------------

export default function SlideCanvas({ slide, kit, carousel, slideIndex, mode, interactive }: SlideCanvasProps) {
  const pal = effectiveColors(slide, kit);
  const [guides, setGuides] = useState<{ v: number | null; h: number | null }>({ v: null, h: null });

  const glowLayer =
    kit.motif === "glow" && kit.glow
      ? slide.kind === "cover"
        ? `radial-gradient(1000px circle at 88% 8%, ${kit.glow}59, transparent 62%)`
        : `radial-gradient(820px circle at 108% 112%, ${kit.glow}36, transparent 62%)`
      : null;

  const sorted = [...slide.elements].sort((a, b) => a.z - b.z);

  const logoOnThisSlide =
    carousel.logo.everySlide === false ? slideIndex === 0 : true;
  const manualLogo = carousel.logo.src && carousel.logo.show && logoOnThisSlide ? carousel.logo : null;
  const frame = carousel.frame;

  return (
    <div
      style={{
        width: CANVAS_W,
        height: CANVAS_H,
        position: "relative",
        overflow: "hidden",
        backgroundColor: resolveColor(slide.bg ?? "bg", slide, kit, pal.bg),
      }}
      onPointerDown={
        interactive
          ? (e) => {
              if (e.target === e.currentTarget) interactive.onSelect(null);
            }
          : undefined
      }
    >
      {slide.bgImage && (
        <img
          src={slide.bgImage}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          draggable={false}
        />
      )}
      {slide.bgImage && (slide.scrim ?? 0) > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, rgba(0,0,0,${((slide.scrim ?? 0) / 100) * 0.45}) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 48%, rgba(0,0,0,${(slide.scrim ?? 0) / 100}) 90%)`,
            pointerEvents: "none",
          }}
        />
      )}
      {glowLayer && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: glowLayer, pointerEvents: "none" }} />
      )}

      {/* molduras PNG topo/base (mesma faixa em todos os slides) */}
      {frame?.top && (
        <img
          src={frame.top}
          alt=""
          draggable={false}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: frame.topH, objectFit: "cover", zIndex: 6, pointerEvents: "none" }}
        />
      )}
      {frame?.bottom && (
        <img
          src={frame.bottom}
          alt=""
          draggable={false}
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: frame.bottomH, objectFit: "cover", zIndex: 6, pointerEvents: "none" }}
        />
      )}

      {sorted.map((el) => (
        <ElementView
          key={el.id}
          el={el}
          slide={slide}
          kit={kit}
          carousel={carousel}
          slideIndex={slideIndex}
          mode={mode}
          interactive={interactive}
          setGuides={setGuides}
        />
      ))}

      {manualLogo && <ManualLogo logo={manualLogo} />}

      {/* guias de snap durante drag */}
      {interactive && guides.v !== null && (
        <div style={{ position: "absolute", left: guides.v, top: 0, width: 2, height: "100%", background: "#22d3ee", opacity: 0.9, pointerEvents: "none", zIndex: 999 }} />
      )}
      {interactive && guides.h !== null && (
        <div style={{ position: "absolute", top: guides.h, left: 0, height: 2, width: "100%", background: "#22d3ee", opacity: 0.9, pointerEvents: "none", zIndex: 999 }} />
      )}
    </div>
  );
}

function ManualLogo({ logo }: { logo: CarouselLogo }) {
  const pos: CSSProperties =
    logo.position === "tl"
      ? { top: SAFE_MARGIN, left: SAFE_MARGIN }
      : logo.position === "tr"
        ? { top: SAFE_MARGIN, right: SAFE_MARGIN }
        : logo.position === "bl"
          ? { bottom: SAFE_MARGIN, left: SAFE_MARGIN }
          : { bottom: SAFE_MARGIN, right: SAFE_MARGIN };
  const scale = logo.scale ?? 1;
  return (
    <img
      src={logo.src!}
      alt="logo"
      style={{ position: "absolute", maxWidth: 240 * scale, maxHeight: 110 * scale, objectFit: "contain", zIndex: 200, ...pos }}
      draggable={false}
    />
  );
}

// ---------------------------------------------------------------------------

interface ElementViewProps {
  el: Element;
  slide: Slide;
  kit: BrandKit;
  carousel: Carousel;
  slideIndex: number;
  mode: CanvasMode;
  interactive?: InteractiveCtx;
  setGuides: (g: { v: number | null; h: number | null }) => void;
}

function ElementView({ el, slide, kit, carousel, slideIndex, mode, interactive, setGuides }: ElementViewProps) {
  const dragRef = useRef<{
    px: number;
    py: number;
    x: number;
    y: number;
    w: number;
    h: number;
    op: "move" | "nw" | "ne" | "sw" | "se";
  } | null>(null);

  // logo de texto do kit some quando há logo manual visível
  if (el.role === "logo" && carousel.logo.src && carousel.logo.show) return null;

  const selected = interactive?.selectedId === el.id;

  const beginPointer = (e: React.PointerEvent, op: "move" | "nw" | "ne" | "sw" | "se") => {
    if (!interactive) return;
    e.stopPropagation();
    interactive.onSelect(el.id);
    dragRef.current = { px: e.clientX, py: e.clientY, x: el.x, y: el.y, w: el.w, h: el.h, op };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ponteiro já liberado (toque rápido) — drag segue sem captura
    }
    document.body.classList.add("cg-dragging");
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || !interactive) return;
    const dx = (e.clientX - d.px) / interactive.scale;
    const dy = (e.clientY - d.py) / interactive.scale;
    const thr = 10;
    if (d.op === "move") {
      let nx = d.x + dx;
      let ny = d.y + dy;
      const sl = snapTo(nx, GUIDES_V, thr);
      const sr = snapTo(nx + d.w, GUIDES_V, thr);
      const st = snapTo(ny, GUIDES_H, thr);
      const sb = snapTo(ny + d.h, GUIDES_H, thr);
      let gv: number | null = null;
      let gh: number | null = null;
      if (sl.guide !== null) {
        nx = sl.value;
        gv = sl.guide;
      } else if (sr.guide !== null) {
        nx = sr.value - d.w;
        gv = sr.guide;
      }
      if (st.guide !== null) {
        ny = st.value;
        gh = st.guide;
      } else if (sb.guide !== null) {
        ny = sb.value - d.h;
        gh = sb.guide;
      }
      setGuides({ v: gv, h: gh });
      interactive.onPatch(el.id, { x: Math.round(nx), y: Math.round(ny) });
    } else {
      let { x, y, w, h } = d;
      if (d.op === "se") {
        w = d.w + dx;
        h = d.h + dy;
      } else if (d.op === "ne") {
        w = d.w + dx;
        y = d.y + dy;
        h = d.h - dy;
      } else if (d.op === "sw") {
        x = d.x + dx;
        w = d.w - dx;
        h = d.h + dy;
      } else {
        x = d.x + dx;
        y = d.y + dy;
        w = d.w - dx;
        h = d.h - dy;
      }
      if (w >= 40 && h >= 30) {
        interactive.onPatch(el.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
      }
    }
  };

  const endPointer = () => {
    dragRef.current = null;
    setGuides({ v: null, h: null });
    document.body.classList.remove("cg-dragging");
  };

  const wrapperStyle: CSSProperties = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    zIndex: el.z,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    cursor: interactive ? "grab" : undefined,
    outline: selected
      ? "3px solid #22d3ee"
      : interactive
        ? "1px dashed rgba(255,255,255,0.12)"
        : undefined,
    outlineOffset: 2,
  };

  const handles: ReactNode = selected && interactive && (
    <>
      {(["nw", "ne", "sw", "se"] as const).map((pos) => (
        <div
          key={pos}
          onPointerDown={(e) => beginPointer(e, pos)}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          style={{
            position: "absolute",
            width: 26,
            height: 26,
            background: "#22d3ee",
            borderRadius: 6,
            zIndex: 50,
            cursor: pos === "nw" || pos === "se" ? "nwse-resize" : "nesw-resize",
            top: pos[0] === "n" ? -13 : undefined,
            bottom: pos[0] === "s" ? -13 : undefined,
            left: pos[1] === "w" ? -13 : undefined,
            right: pos[1] === "e" ? -13 : undefined,
          }}
        />
      ))}
    </>
  );

  return (
    <div
      style={wrapperStyle}
      onPointerDown={interactive ? (e) => beginPointer(e, "move") : undefined}
      onPointerMove={interactive ? onPointerMove : undefined}
      onPointerUp={interactive ? endPointer : undefined}
    >
      <ElementContent el={el} slide={slide} kit={kit} slideIndex={slideIndex} mode={mode} />
      {handles}
    </div>
  );
}

// ---------------------------------------------------------------------------

function ElementContent({
  el,
  slide,
  kit,
  slideIndex,
  mode,
}: {
  el: Element;
  slide: Slide;
  kit: BrandKit;
  slideIndex: number;
  mode: CanvasMode;
}) {
  const pal = effectiveColors(slide, kit);

  if (el.type === "social") {
    const color = resolveColor(el.color ?? "text", slide, kit, pal.text);
    const size = Math.min(el.h, 64);
    const justify = el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start";
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: justify, gap: el.gap ?? 48, color }}>
        <Heart size={size} strokeWidth={1.8} />
        <MessageCircle size={size} strokeWidth={1.8} />
        <Send size={size} strokeWidth={1.8} />
        <Bookmark size={size} strokeWidth={1.8} style={{ marginLeft: "auto" }} />
      </div>
    );
  }

  if (el.type === "shape") {
    const fill = resolveColor(el.fill ?? "accent", slide, kit, pal.accent);
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: fill,
          borderRadius: el.shape === "line" ? 999 : (el.radius2 ?? 0),
        }}
      />
    );
  }

  if (el.type === "image") {
    if (!el.src) {
      if (mode === "export") return null;
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `3px dashed ${pal.muted}66`,
            borderRadius: el.radius ?? 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            color: `${pal.muted}AA`,
            fontSize: 32,
            fontFamily: resolveFont("label", kit),
          }}
        >
          <ImageIcon size={44} /> Imagem
        </div>
      );
    }
    return (
      <img
        src={el.src}
        alt=""
        draggable={false}
        style={{
          width: "100%",
          height: "100%",
          objectFit: el.fit ?? "cover",
          borderRadius: el.radius ?? 0,
          boxShadow: el.shadow ? "0 24px 60px rgba(0,0,0,0.45)" : undefined,
        }}
      />
    );
  }

  // ---- texto ----
  const color = resolveColor(el.color, slide, kit, pal.text);
  const baseStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    fontFamily: resolveFont(el.fontRole, kit),
    fontSize: el.fontSize ?? 40,
    fontWeight: el.fontWeight ?? 400,
    lineHeight: el.lineHeight ?? 1.25,
    letterSpacing: el.letterSpacing != null ? `${el.letterSpacing}px` : undefined,
    textAlign: el.align ?? "left",
    textTransform: el.uppercase ? "uppercase" : undefined,
    color,
    whiteSpace: "pre-wrap",
    overflowWrap: "break-word",
  };
  const richOpts = { accent: pal.accent, accent2: kit.accent2, bg: pal.bg, muted: pal.muted };
  const rich = renderRich(el.text ?? "", richOpts);

  if (el.role === "eyebrow") {
    const idx = String(slideIndex + 1).padStart(2, "0");
    const justify = el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start";
    const inner: CSSProperties = {
      fontFamily: resolveFont(el.fontRole ?? "label", kit),
      fontSize: el.fontSize ?? 30,
      fontWeight: el.fontWeight ?? 400,
      letterSpacing: `${el.letterSpacing ?? 3}px`,
      textTransform: "uppercase",
      display: "inline-flex",
      alignItems: "center",
      whiteSpace: "nowrap",
    };
    return (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-start", justifyContent: justify }}>
        {kit.eyebrow === "handle" ? (
          <span
            style={{
              ...inner,
              textTransform: "none",
              letterSpacing: "0.2px",
              fontWeight: 600,
              fontSize: (el.fontSize ?? 30) * 0.95,
              color: pal.text,
              backgroundColor: `${pal.text}12`,
              border: `1.5px solid ${pal.text}1f`,
              borderRadius: 999,
              padding: "0.5em 1.1em",
              gap: "0.55em",
            }}
          >
            <span
              style={{
                width: "0.95em",
                height: "0.95em",
                borderRadius: 999,
                background: kit.accent2
                  ? `linear-gradient(135deg, ${pal.accent}, ${kit.accent2})`
                  : pal.accent,
                flexShrink: 0,
              }}
            />
            {el.text || kit.logo}
          </span>
        ) : kit.eyebrow === "pill-index" ? (
          <span
            style={{
              ...inner,
              color: resolveColor(el.color ?? "accent", slide, kit, pal.accent),
              border: `2px solid ${pal.accent}66`,
              borderRadius: 999,
              padding: "0.45em 1.1em",
            }}
          >
            {idx}&nbsp;—&nbsp;{renderRich(el.text ?? "", { accent: pal.accent, bg: pal.bg, muted: pal.muted })}
          </span>
        ) : kit.eyebrow === "badge" ? (
          <span
            style={{
              ...inner,
              backgroundColor: pal.accent,
              color: pal.bg,
              borderRadius: 8,
              padding: "0.45em 1em",
            }}
          >
            {renderRich(el.text ?? "", { accent: pal.bg, bg: pal.accent, muted: pal.muted })}
          </span>
        ) : (
          <span style={{ ...inner, color: resolveColor(el.color ?? "accent", slide, kit, pal.accent) }}>
            {rich}
          </span>
        )}
      </div>
    );
  }

  if (el.role === "cta-primary" || el.role === "cta-secondary") {
    // variante padrão por compatibilidade: primary=solid; secondary=outline em slide cta, senão texto puro
    const variant =
      el.ctaVariant ?? (el.role === "cta-primary" ? "solid" : slide.kind === "cta" ? "outline" : "text");
    const Icon = el.ctaIcon && el.ctaIcon !== "none" ? CTA_ICONS[el.ctaIcon] : null;
    const iconSize = (el.fontSize ?? 34) * 0.95;

    if (variant === "text") {
      const justify = el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start";
      return (
        <div style={{ ...baseStyle, display: "flex", alignItems: "center", justifyContent: justify, gap: "0.4em", lineHeight: 1.15 }}>
          <span>{rich}</span>
          {Icon && <Icon size={iconSize} strokeWidth={2.4} style={{ flexShrink: 0 }} />}
        </div>
      );
    }

    // pílula (solid / soft / outline)
    const box: CSSProperties =
      variant === "solid"
        ? { backgroundColor: pal.accent, color: resolveColor(el.color ?? "bg", slide, kit, pal.bg) }
        : variant === "soft"
          ? { backgroundColor: `${pal.accent}26`, color: pal.accent, border: `2px solid ${pal.accent}55` }
          : { backgroundColor: "transparent", color: pal.accent, border: `3px solid ${pal.accent}` };
    const richColors =
      variant === "solid"
        ? { accent: box.color as string, bg: pal.accent, muted: box.color as string }
        : { accent: pal.accent, bg: pal.bg, muted: pal.accent };
    return (
      <div
        style={{
          ...baseStyle,
          ...box,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5em",
          lineHeight: 1.1,
          padding: "0 0.4em",
        }}
      >
        <span>{renderRich(el.text ?? "", richColors)}</span>
        {Icon && <Icon size={iconSize} strokeWidth={2.6} style={{ flexShrink: 0 }} />}
      </div>
    );
  }

  if (el.role === "logo") {
    const justify = el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start";
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: justify,
          fontFamily: resolveFont(el.fontRole ?? "label", kit),
          fontSize: el.fontSize ?? 28,
          color,
          letterSpacing: `${el.letterSpacing ?? 2}px`,
        }}
      >
        {el.text ? (
          <span style={{ fontWeight: el.fontWeight ?? 700 }}>{rich}</span>
        ) : (
          <>
            <span style={{ fontWeight: 700 }}>{kit.logo}</span>
            {kit.sub && (
              <span style={{ fontWeight: 400, opacity: 0.65, marginLeft: "0.7em", fontSize: "0.82em" }}>
                {kit.sub}
              </span>
            )}
          </>
        )}
      </div>
    );
  }

  return <div style={baseStyle}>{rich}</div>;
}
