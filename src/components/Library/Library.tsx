import { useState } from "react";
import type { BrandKit, Carousel, Collection, Template } from "../../types";
import { STRUCTURES } from "../../config/structures";
import { getKit } from "../../config/kits";
import { Btn, Field, FileButton, Select } from "../ui";
import CarouselCard from "./CarouselCard";
import Collections from "./Collections";
import { GalleryHorizontalEnd, LayoutTemplate, Plus, Scissors, Trash2 } from "lucide-react";

interface Props {
  carousels: Carousel[];
  templates: Template[];
  collections: Collection[];
  kits: BrandKit[];
  customKits: BrandKit[];
  onOpen: (id: string) => void;
  onCreate: (structureId: string) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onCreateContinuous: (dataUrl: string) => void;
  onDuplicateCarousel: (id: string) => void;
  onDeleteCarousel: (id: string) => void;
  onAssignCollection: (carouselId: string, collectionId: string | undefined) => void;
  onCreateCollection: () => void;
  onDuplicateCollection: (id: string) => void;
  onDeleteCollection: (id: string) => void;
  onDeleteTemplate: (id: string) => void;
}

export default function Library(props: Props) {
  const [filter, setFilter] = useState<string | null>(null);
  const [panel, setPanel] = useState<"new" | "template" | "continuous" | null>(null);
  const [structureId, setStructureId] = useState(STRUCTURES[0].id);
  const [templateId, setTemplateId] = useState("");

  const visible = props.carousels.filter((c) => filter === null || c.collectionId === filter);
  const counts: Record<string, number> = {};
  for (const c of props.carousels) {
    if (c.collectionId) counts[c.collectionId] = (counts[c.collectionId] ?? 0) + 1;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <GalleryHorizontalEnd className="text-violet-400" size={26} />
        <div className="mr-auto">
          <h1 className="text-lg font-semibold text-zinc-100">Gerador de Carrossel</h1>
          <p className="text-xs text-zinc-500">Estrutura × Marca × Conteúdo — sem IA, sem custo, direto no navegador.</p>
        </div>
        <Btn variant="primary" onClick={() => setPanel(panel === "new" ? null : "new")}>
          <Plus size={14} /> Novo carrossel
        </Btn>
        <Btn onClick={() => setPanel(panel === "template" ? null : "template")} disabled={props.templates.length === 0} title={props.templates.length === 0 ? "Salve um carrossel como template primeiro" : undefined}>
          <LayoutTemplate size={14} /> A partir de template
        </Btn>
        <Btn onClick={() => setPanel(panel === "continuous" ? null : "continuous")} title="Fatiar imagem wide em slides 1080×1350">
          <Scissors size={14} /> Carrossel contínuo
        </Btn>
      </header>

      {panel && (
        <div className="mb-6 rounded-xl border border-white/10 bg-zinc-900/70 p-4">
          {panel === "new" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-72">
                <Field label="Estrutura">
                  <Select value={structureId} onChange={setStructureId} options={STRUCTURES.map((s) => ({ value: s.id, label: s.name }))} />
                </Field>
                <p className="-mt-1 text-[11px] text-zinc-500">{STRUCTURES.find((s) => s.id === structureId)?.framework}</p>
              </div>
              <Btn
                variant="primary"
                className="mb-3"
                onClick={() => {
                  props.onCreate(structureId);
                  setPanel(null);
                }}
              >
                Criar
              </Btn>
              <p className="mb-3 max-w-xs text-[11px] text-zinc-500">
                Já vem com cores e fontes editáveis. Ajuste tudo no editor e salve como seu próprio template.
              </p>
            </div>
          )}
          {panel === "template" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-72">
                <Field label="Template salvo">
                  <Select
                    value={templateId || props.templates[0]?.id || ""}
                    onChange={setTemplateId}
                    options={props.templates.map((t) => ({ value: t.id, label: `${t.name} (${t.slides.length} slides)` }))}
                  />
                </Field>
              </div>
              <Btn
                variant="primary"
                className="mb-3"
                onClick={() => {
                  const id = templateId || props.templates[0]?.id;
                  if (id) props.onCreateFromTemplate(id);
                  setPanel(null);
                }}
              >
                Clonar template
              </Btn>
              <Btn
                variant="danger"
                className="mb-3"
                onClick={() => {
                  const id = templateId || props.templates[0]?.id;
                  if (id && confirm("Excluir este template?")) props.onDeleteTemplate(id);
                }}
              >
                <Trash2 size={13} />
              </Btn>
            </div>
          )}
          {panel === "continuous" && (
            <div className="flex flex-wrap items-end gap-3">
              <div className="mb-3">
                <FileButton
                  label="Subir imagem wide e fatiar"
                  onFile={(dataUrl) => {
                    props.onCreateContinuous(dataUrl);
                    setPanel(null);
                  }}
                />
              </div>
              <p className="mb-3 max-w-sm text-[11px] text-zinc-500">
                A imagem é escalada pra 1350 de altura e fatiada em tiras 1080×1350 alinhadas — uma por slide.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-8">
        <Collections
          collections={props.collections}
          filter={filter}
          counts={counts}
          total={props.carousels.length}
          onFilter={setFilter}
          onCreate={props.onCreateCollection}
          onDuplicate={props.onDuplicateCollection}
          onDelete={(id) => {
            props.onDeleteCollection(id);
            if (filter === id) setFilter(null);
          }}
        />

        <main className="min-w-0 flex-1">
          {visible.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-zinc-500">
              <GalleryHorizontalEnd size={32} className="opacity-40" />
              <p className="text-sm">Nenhum carrossel {filter ? "nesta coleção" : "ainda"}.</p>
              <p className="text-xs">Crie um novo a partir de uma estrutura viral.</p>
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
                  onDuplicate={() => props.onDuplicateCarousel(c.id)}
                  onDelete={() => props.onDeleteCarousel(c.id)}
                  onAssignCollection={(collectionId) => props.onAssignCollection(c.id, collectionId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
