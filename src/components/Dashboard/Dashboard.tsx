import { useState } from "react";
import type { BrandKit, Carousel, CarouselStatus, Collection } from "../../types";
import CarouselCard from "../Library/CarouselCard";
import { Sparkles, Target, ArrowRight, GalleryHorizontalEnd, Plus } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  carousels: Carousel[];
  collections: Collection[];
  resolveKit: (c: Carousel) => BrandKit;
  currentUserId: number;
  onGerarIA: () => void;
  onCriar: () => void;
  onTemplates: () => void;
  onTreinar: () => void;
  onOpen: (id: string) => void;
  onUseAsBase: (id: string) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: CarouselStatus) => void;
  onAssignCollection: (carouselId: string, collectionId: string | undefined) => void;
}

function ActionCard({ icon, title, desc, cta, onClick }: { icon: ReactNode; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <div className="glass flex flex-col p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/5 text-[var(--brand-hi)]">{icon}</div>
      <h3 className="text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1 mb-4 text-xs leading-relaxed text-[var(--text-md)]">{desc}</p>
      <button className="btn btn-primary mt-auto self-start" onClick={onClick}>
        {cta} <ArrowRight size={15} />
      </button>
    </div>
  );
}

const STATUSES: { id: CarouselStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "rascunho", label: "Rascunho" },
  { id: "revisao", label: "Em revisão" },
  { id: "aprovado", label: "Aprovado" },
  { id: "publicado", label: "Publicado" },
];

export default function Dashboard(props: Props) {
  const [colFilter, setColFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<CarouselStatus | "todos">("todos");
  const [mineOnly, setMineOnly] = useState(false);

  const visible = props.carousels.filter(
    (c) =>
      (colFilter === null || c.collectionId === colFilter) &&
      (statusFilter === "todos" || (c.status ?? "rascunho") === statusFilter) &&
      (!mineOnly || c.ownerId === props.currentUserId)
  );

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs transition ${active ? "bg-[var(--brand-sat)] text-white" : "bg-white/5 text-[var(--text-md)] hover:text-white"}`;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          <span className="grad-text">Olá, Meraki</span> 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--text-md)]">Biblioteca compartilhada da equipe — acompanhe o progresso de todos e reaproveite qualquer carrossel.</p>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <ActionCard icon={<Sparkles size={20} />} title="Gerar com IA" desc="Descreva o tema e a IA monta o carrossel completo — texto, estrutura e imagem." cta="Gerar agora" onClick={props.onGerarIA} />
        <ActionCard icon={<Plus size={20} />} title="Criar do zero" desc="Comece com os slides em branco e monte tudo à mão no editor." cta="Criar" onClick={props.onCriar} />
        <ActionCard icon={<Target size={20} />} title="Templates" desc="Reaproveite um design salvo pela equipe e mantenha a consistência." cta="Explorar" onClick={props.onTemplates} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="mr-auto text-sm font-semibold uppercase tracking-wide text-[var(--text-md)]">Carrosséis da equipe</h2>
        <button onClick={() => setMineOnly((m) => !m)} className={chip(mineOnly)}>Só os meus</button>
        {STATUSES.map((s) => (
          <button key={s.id} onClick={() => setStatusFilter(s.id)} className={chip(statusFilter === s.id)}>{s.label}</button>
        ))}
      </div>
      {props.collections.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button onClick={() => setColFilter(null)} className={chip(colFilter === null)}>Todas as coleções</button>
          {props.collections.map((col) => (
            <button key={col.id} onClick={() => setColFilter(col.id)} className={chip(colFilter === col.id)}>{col.name}</button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 text-[var(--text-lo)]">
          <GalleryHorizontalEnd size={30} className="opacity-40" />
          <p className="text-sm">Nenhum carrossel por aqui.</p>
          <button className="btn btn-primary" onClick={props.onGerarIA}><Sparkles size={15} /> Gerar o primeiro</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visible.map((c) => (
            <CarouselCard
              key={c.id}
              carousel={c}
              kit={props.resolveKit(c)}
              collections={props.collections}
              onOpen={() => props.onOpen(c.id)}
              onUseAsBase={() => props.onUseAsBase(c.id)}
              onDelete={() => props.onDelete(c.id)}
              onSetStatus={(s) => props.onSetStatus(c.id, s)}
              onAssignCollection={(collectionId) => props.onAssignCollection(c.id, collectionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
