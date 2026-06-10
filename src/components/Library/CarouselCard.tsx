import type { BrandKit, Carousel, Collection } from "../../types";
import { CANVAS_H, CANVAS_W } from "../../types";
import { STRUCTURES } from "../../config/structures";
import SlideCanvas from "../SlideCanvas";
import { Copy, Trash2 } from "lucide-react";

const THUMB_SCALE = 0.16;

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  collections: Collection[];
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAssignCollection: (collectionId: string | undefined) => void;
}

export default function CarouselCard({ carousel, kit, collections, onOpen, onDuplicate, onDelete, onAssignCollection }: Props) {
  const structureName = STRUCTURES.find((s) => s.id === carousel.templateId)?.name ?? "Personalizada";
  const collection = collections.find((c) => c.id === carousel.collectionId);

  return (
    <div className="group overflow-hidden rounded-xl border border-white/8 bg-zinc-900/60 transition hover:border-white/20">
      <button type="button" onClick={onOpen} className="relative block w-full" style={{ height: CANVAS_H * THUMB_SCALE }}>
        <div
          style={{
            transform: `scale(${THUMB_SCALE})`,
            transformOrigin: "top left",
            width: CANVAS_W,
            height: CANVAS_H,
            pointerEvents: "none",
          }}
        >
          {carousel.slides[0] && (
            <SlideCanvas slide={carousel.slides[0]} kit={kit} carousel={carousel} slideIndex={0} mode="preview" />
          )}
        </div>
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-300 backdrop-blur">
          {carousel.slides.length} slides
        </span>
      </button>
      <div className="space-y-2 p-3">
        <button type="button" onClick={onOpen} className="block w-full truncate text-left text-sm font-medium text-zinc-100 hover:text-violet-300">
          {carousel.name}
        </button>
        <p className="truncate text-[11px] text-zinc-500">
          {structureName} · {kit.name}
        </p>
        <div className="flex items-center gap-1.5">
          <select
            value={carousel.collectionId ?? ""}
            onChange={(e) => onAssignCollection(e.target.value || undefined)}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] text-zinc-300 outline-none"
            style={collection ? { borderColor: `${collection.color}88` } : undefined}
          >
            <option value="" className="bg-zinc-900">
              Sem coleção
            </option>
            {collections.map((c) => (
              <option key={c.id} value={c.id} className="bg-zinc-900">
                {c.name}
              </option>
            ))}
          </select>
          <button type="button" title="Duplicar" onClick={onDuplicate} className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10">
            <Copy size={13} />
          </button>
          <button
            type="button"
            title="Excluir"
            onClick={() => confirm(`Excluir "${carousel.name}"?`) && onDelete()}
            className="rounded-md p-1.5 text-red-400/70 hover:bg-red-500/15"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
