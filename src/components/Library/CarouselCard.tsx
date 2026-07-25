import type { BrandKit, Carousel, CarouselStatus, Collection } from "../../types";
import { CANVAS_H, CANVAS_W } from "../../types";
import SlideCanvas from "../SlideCanvas";
import { Copy, Trash2 } from "lucide-react";

const THUMB_SCALE = 0.16;

const STATUS_META: Record<CarouselStatus, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-white/10 text-[var(--text-md)]" },
  revisao: { label: "Em revisão", cls: "bg-amber-500/20 text-amber-300" },
  aprovado: { label: "Aprovado", cls: "bg-emerald-500/20 text-emerald-300" },
  publicado: { label: "Publicado", cls: "bg-[var(--brand-sat)]/30 text-[var(--brand-hi)]" },
};

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  collections: Collection[];
  onOpen: () => void;
  onUseAsBase: () => void;
  onDelete: () => void;
  onSetStatus: (s: CarouselStatus) => void;
  onAssignCollection: (collectionId: string | undefined) => void;
}

export default function CarouselCard({ carousel, kit, collections, onOpen, onUseAsBase, onDelete, onSetStatus, onAssignCollection }: Props) {
  const collection = collections.find((c) => c.id === carousel.collectionId);
  const status = (carousel.status ?? "rascunho") as CarouselStatus;

  return (
    <div className="group overflow-hidden rounded-xl border border-white/8 bg-zinc-900/60 transition hover:border-white/20">
      <button type="button" onClick={onOpen} className="relative block w-full" style={{ height: CANVAS_H * THUMB_SCALE }}>
        <div style={{ transform: `scale(${THUMB_SCALE})`, transformOrigin: "top left", width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}>
          {carousel.slides[0] && <SlideCanvas slide={carousel.slides[0]} kit={kit} carousel={carousel} slideIndex={0} mode="preview" />}
        </div>
        <span className={`absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium backdrop-blur ${STATUS_META[status].cls}`}>
          {STATUS_META[status].label}
        </span>
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-zinc-300 backdrop-blur">
          {carousel.slides.length} slides
        </span>
      </button>
      <div className="space-y-2 p-3">
        <button type="button" onClick={onOpen} className="block w-full truncate text-left text-sm font-medium text-zinc-100 hover:text-[var(--brand-hi)]">
          {carousel.name}
        </button>
        <p className="truncate text-[11px] text-zinc-500">por {carousel.ownerName ?? "—"}</p>

        <div className="flex items-center gap-1.5">
          <select
            value={status}
            onChange={(e) => onSetStatus(e.target.value as CarouselStatus)}
            className="min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] text-zinc-300 outline-none"
          >
            <option value="rascunho" className="bg-zinc-900">Rascunho</option>
            <option value="revisao" className="bg-zinc-900">Em revisão</option>
            <option value="aprovado" className="bg-zinc-900">Aprovado</option>
            <option value="publicado" className="bg-zinc-900">Publicado</option>
          </select>
          <button type="button" title="Usar como base (clona pra você)" onClick={onUseAsBase} className="rounded-md p-1.5 text-zinc-400 hover:bg-white/10">
            <Copy size={13} />
          </button>
          <button type="button" title="Excluir" onClick={() => confirm(`Excluir "${carousel.name}"?`) && onDelete()} className="rounded-md p-1.5 text-red-400/70 hover:bg-red-500/15">
            <Trash2 size={13} />
          </button>
        </div>

        <select
          value={carousel.collectionId ?? ""}
          onChange={(e) => onAssignCollection(e.target.value || undefined)}
          className="w-full rounded-md border border-white/10 bg-white/5 px-1.5 py-1 text-[11px] text-zinc-300 outline-none"
          style={collection ? { borderColor: `${collection.color}88` } : undefined}
        >
          <option value="" className="bg-zinc-900">Sem coleção</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
