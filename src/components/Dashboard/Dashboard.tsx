import { useState } from "react";
import type { BrandKit, Carousel, Collection } from "../../types";
import { getKit } from "../../config/kits";
import CarouselCard from "../Library/CarouselCard";
import { Sparkles, LayoutTemplate, Target, ArrowRight, GalleryHorizontalEnd } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  carousels: Carousel[];
  collections: Collection[];
  customKits: BrandKit[];
  onGerarIA: () => void;
  onTemplates: () => void;
  onTreinar: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onAssignCollection: (carouselId: string, collectionId: string | undefined) => void;
}

function ActionCard({ icon, title, desc, cta, onClick }: { icon: ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/5 text-[var(--brand-hi)]">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1 mb-4 text-xs leading-relaxed text-[var(--text-md)]">{desc}</p>
      <button className="btn btn-primary mt-auto self-start" onClick={onClick}>
        {cta} <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default function Dashboard(props: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const visible = props.carousels.filter((c) => filter === null || c.collectionId === filter);

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          <span className="grad-text">Olá, Meraki</span> 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--text-md)]">Vamos criar conteúdo que cresce hoje?</p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <ActionCard
          icon={<Sparkles size={20} />}
          title="Gerar com IA"
          desc="Descreva o tema e a IA monta o carrossel completo — texto, estrutura e imagem."
          cta="Gerar agora"
          onClick={props.onGerarIA}
        />
        <ActionCard
          icon={<LayoutTemplate size={20} />}
          title="Templates"
          desc="Comece de um modelo salvo e mantenha a consistência da marca."
          cta="Explorar templates"
          onClick={props.onTemplates}
        />
        <ActionCard
          icon={<Target size={20} />}
          title="Treinar Marca"
          desc="Ensine a voz de cada cliente para a IA escrever no tom certo."
          cta="Configurar"
          onClick={props.onTreinar}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="mr-auto text-sm font-semibold uppercase tracking-wide text-[var(--text-md)]">Meus carrosséis</h2>
        {props.collections.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full px-3 py-1 text-xs transition ${filter === null ? "bg-[var(--brand-sat)] text-white" : "bg-white/5 text-[var(--text-md)] hover:text-white"}`}
            >
              Todos
            </button>
            {props.collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setFilter(col.id)}
                className={`rounded-full px-3 py-1 text-xs transition ${filter === col.id ? "bg-[var(--brand-sat)] text-white" : "bg-white/5 text-[var(--text-md)] hover:text-white"}`}
              >
                {col.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 text-[var(--text-lo)]">
          <GalleryHorizontalEnd size={30} className="opacity-40" />
          <p className="text-sm">Nenhum carrossel ainda.</p>
          <button className="btn btn-primary" onClick={props.onGerarIA}>
            <Sparkles size={15} /> Gerar o primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => (
            <CarouselCard
              key={c.id}
              carousel={c}
              kit={getKit(c.kitId, props.customKits)}
              collections={props.collections}
              onOpen={() => props.onOpen(c.id)}
              onDuplicate={() => props.onDuplicate(c.id)}
              onDelete={() => props.onDelete(c.id)}
              onAssignCollection={(collectionId) => props.onAssignCollection(c.id, collectionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
