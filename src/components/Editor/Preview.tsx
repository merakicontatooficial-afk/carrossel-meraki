import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, Element } from "../../types";
import { CANVAS_H, CANVAS_W } from "../../types";
import SlideCanvas, { type InteractiveCtx } from "../SlideCanvas";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  index: number;
  setIndex: (i: number) => void;
  manualMode: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPatchElement: (elId: string, patch: Partial<Element>) => void;
}

export default function Preview({
  carousel,
  kit,
  index,
  setIndex,
  manualMode,
  selectedId,
  onSelect,
  onPatchElement,
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
    ? { scale, selectedId, onSelect, onPatch: onPatchElement }
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
          <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: CANVAS_W, height: CANVAS_H }}>
            <SlideCanvas
              slide={slide}
              kit={kit}
              carousel={carousel}
              slideIndex={index}
              mode={manualMode ? "edit" : "preview"}
              interactive={interactive}
            />
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
            className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-violet-400" : "w-2 bg-white/20 hover:bg-white/40"}`}
          />
        ))}
        <span className="ml-3 text-[11px] tabular-nums text-zinc-500">
          {index + 1}/{carousel.slides.length}
        </span>
      </div>
    </div>
  );
}
