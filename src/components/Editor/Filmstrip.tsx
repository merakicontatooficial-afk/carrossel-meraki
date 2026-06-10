import type { BrandKit, Carousel } from "../../types";
import { CANVAS_H, CANVAS_W } from "../../types";
import SlideCanvas from "../SlideCanvas";
import { ArrowLeftRight, Copy, Trash2 } from "lucide-react";

const THUMB_SCALE = 0.075; // ~81×101

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  index: number;
  setIndex: (i: number) => void;
  onDuplicate: (i: number) => void;
  onDelete: (i: number) => void;
  onMove: (i: number, dir: -1 | 1) => void;
}

/** Filmstrip com miniaturas reais dos slides + ações de ordenação. */
export default function Filmstrip({ carousel, kit, index, setIndex, onDuplicate, onDelete, onMove }: Props) {
  return (
    <div className="border-t border-white/8 px-3 py-2">
      <div className="flex items-end gap-2 overflow-x-auto pb-1">
        {carousel.slides.map((slide, i) => (
          <div key={slide.id} className="flex shrink-0 flex-col items-center gap-1">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={`overflow-hidden rounded-md transition ${
                i === index ? "ring-2 ring-violet-400" : "opacity-70 ring-1 ring-white/10 hover:opacity-100"
              }`}
              style={{ width: CANVAS_W * THUMB_SCALE, height: CANVAS_H * THUMB_SCALE }}
            >
              <div
                style={{
                  transform: `scale(${THUMB_SCALE})`,
                  transformOrigin: "top left",
                  width: CANVAS_W,
                  height: CANVAS_H,
                  pointerEvents: "none",
                }}
              >
                <SlideCanvas slide={slide} kit={kit} carousel={carousel} slideIndex={i} mode="preview" />
              </div>
            </button>
            {i === index ? (
              <div className="flex gap-0.5">
                <button type="button" title="Mover pra esquerda" disabled={i === 0} onClick={() => onMove(i, -1)} className="rounded p-0.5 text-zinc-400 hover:bg-white/10 disabled:opacity-25">
                  <ArrowLeftRight size={11} className="-scale-x-100" />
                </button>
                <button type="button" title="Duplicar slide" onClick={() => onDuplicate(i)} className="rounded p-0.5 text-zinc-400 hover:bg-white/10">
                  <Copy size={11} />
                </button>
                <button
                  type="button"
                  title="Excluir slide"
                  disabled={carousel.slides.length <= 1}
                  onClick={() => onDelete(i)}
                  className="rounded p-0.5 text-red-400/80 hover:bg-red-500/15 disabled:opacity-25"
                >
                  <Trash2 size={11} />
                </button>
                <button type="button" title="Mover pra direita" disabled={i === carousel.slides.length - 1} onClick={() => onMove(i, 1)} className="rounded p-0.5 text-zinc-400 hover:bg-white/10 disabled:opacity-25">
                  <ArrowLeftRight size={11} />
                </button>
              </div>
            ) : (
              <span className="text-[10px] tabular-nums text-zinc-600">{i + 1}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
