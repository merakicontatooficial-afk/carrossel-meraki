import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, Element } from "../../types";
import { CANVAS_H, CANVAS_W, SAFE_MARGIN } from "../../types";
import SlideCanvas, { type InteractiveCtx } from "../SlideCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  index: number;
  setIndex: (i: number) => void;
  manualMode: boolean;
  showGrid?: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatchElement: (elId: string, patch: Partial<Element>) => void;
  onMoveLogo: (x: number, y: number) => void;
  onMoveCounter: (x: number, y: number) => void;
  onCommit?: () => void;
  onContextMenu?: (id: string, x: number, y: number) => void;
}

export default function Preview({
  carousel,
  kit,
  index,
  setIndex,
  manualMode,
  showGrid,
  selectedId,
  onSelect,
  onPatchElement,
  onMoveLogo,
  onMoveCounter,
  onCommit,
  onContextMenu,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => {
      const r = box.getBoundingClientRect();
      setScale(Math.max(0.1, Math.min((r.width - 24) / CANVAS_W, (r.height - 24) / CANVAS_H)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const slide = carousel.slides[index];
  if (!slide) return null;

  const interactive: InteractiveCtx | undefined = manualMode
    ? { scale, selectedId, onSelect, onPatch: onPatchElement, onMoveLogo, onMoveCounter, onCommit, onContextMenu }
    : undefined;

  const prev = () => setIndex(Math.max(0, index - 1));
  const next = () => setIndex(Math.min(carousel.slides.length - 1, index + 1));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={boxRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div
          style={{
            width: CANVAS_W * scale,
            height: CANVAS_H * scale,
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 12px 50px rgba(0,0,0,0.5)",
            flexShrink: 0,
          }}
        >
          <div style={{ position: "relative", transform: `scale(${scale})`, transformOrigin: "top left", width: CANVAS_W, height: CANVAS_H }}>
            <SlideCanvas
              slide={slide}
              kit={kit}
              carousel={carousel}
              slideIndex={index}
              mode={manualMode ? "edit" : "preview"}
              interactive={interactive}
            />
            {showGrid && (
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 600 }}>
                {[SAFE_MARGIN, CANVAS_W / 3, CANVAS_W / 2, (2 * CANVAS_W) / 3, CANVAS_W - SAFE_MARGIN].map((x, i) => (
                  <div key={"v" + i} style={{ position: "absolute", left: x, top: 0, bottom: 0, width: x === CANVAS_W / 2 ? 2 : 1, background: x === CANVAS_W / 2 ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.14)" }} />
                ))}
                {[SAFE_MARGIN, CANVAS_H / 3, CANVAS_H / 2, (2 * CANVAS_H) / 3, CANVAS_H - SAFE_MARGIN].map((y, i) => (
                  <div key={"h" + i} style={{ position: "absolute", top: y, left: 0, right: 0, height: y === CANVAS_H / 2 ? 2 : 1, background: y === CANVAS_H / 2 ? "rgba(34,211,238,0.5)" : "rgba(255,255,255,0.14)" }} />
                ))}
                <div style={{ position: "absolute", left: SAFE_MARGIN, top: SAFE_MARGIN, right: SAFE_MARGIN, bottom: SAFE_MARGIN, border: "1px dashed rgba(34,211,238,0.4)" }} />
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-zinc-200 backdrop-blur hover:bg-black/70 disabled:opacity-25"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={next}
          disabled={index === carousel.slides.length - 1}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-zinc-200 backdrop-blur hover:bg-black/70 disabled:opacity-25"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 py-2">
        {carousel.slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-[var(--brand-hi)]" : "w-2 bg-white/20 hover:bg-white/40"}`}
          />
        ))}
        <span className="ml-3 text-[11px] tabular-nums text-zinc-500">
          {index + 1}/{carousel.slides.length}
        </span>
      </div>
    </div>
  );
}
