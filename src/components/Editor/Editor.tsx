import { useState } from "react";
import type { BrandKit, Carousel, Element, Slide } from "../../types";
import { STRUCTURES, getStructure } from "../../config/structures";
import { effectiveColors } from "../../lib/resolve";
import { cloneSlides } from "../../lib/clone";
import { exportCarousel } from "../../lib/export";
import { Btn, ColorInput, Field, NumberInput, Section, Select } from "../ui";
import IdentityPanel from "./IdentityPanel";
import LogoUploader from "./LogoUploader";
import FramePanel from "./FramePanel";
import CounterPanel from "./CounterPanel";
import StructuredForm from "./StructuredForm";
import ManualInspector from "./ManualInspector";
import Preview from "./Preview";
import Filmstrip from "./Filmstrip";
import { ArrowLeft, Bookmark, Download, Lock, Move, Pencil, RotateCcw, Unlock, Wand2 } from "lucide-react";

interface Props {
  carousel: Carousel;
  kit: BrandKit;
  onChange: (c: Carousel) => void;
  onUpdateCustomKit: (kit: BrandKit) => void;
  onCreateCustomKit: (kit: BrandKit) => void;
  onSaveAsTemplate: () => void;
  onBack: () => void;
}

export default function Editor({
  carousel,
  kit,
  onChange,
  onUpdateCustomKit,
  onCreateCustomKit,
  onSaveAsTemplate,
  onBack,
}: Props) {
  const [index, setIndexRaw] = useState(0);
  const [manualMode, setManualMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const safeIndex = Math.min(index, carousel.slides.length - 1);
  const slide = carousel.slides[safeIndex];

  const setIndex = (i: number) => {
    setIndexRaw(i);
    setSelectedId(null);
  };

  // --- helpers de atualização imutável ---
  const patchSlide = (i: number, patch: Partial<Slide>) => {
    const slides = carousel.slides.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...carousel, slides });
  };

  const patchElement = (elId: string, patch: Partial<Element>) => {
    const slides = carousel.slides.map((s, j) =>
      j === safeIndex
        ? { ...s, elements: s.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)) }
        : s
    );
    onChange({ ...carousel, slides });
  };

  const replaceElements = (elements: Element[]) => patchSlide(safeIndex, { elements });

  // --- operações de slide (filmstrip) ---
  const duplicateSlide = (i: number) => {
    const slides = [...carousel.slides];
    slides.splice(i + 1, 0, cloneSlides([carousel.slides[i]])[0]);
    onChange({ ...carousel, slides });
    setIndex(i + 1);
  };

  const deleteSlide = (i: number) => {
    if (carousel.slides.length <= 1) return;
    const slides = carousel.slides.filter((_, j) => j !== i);
    onChange({ ...carousel, slides });
    setIndex(Math.min(i, slides.length - 1));
  };

  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= carousel.slides.length) return;
    const slides = [...carousel.slides];
    [slides[i], slides[j]] = [slides[j], slides[i]];
    onChange({ ...carousel, slides });
    setIndex(j);
  };

  const changeStructure = (id: string) => {
    if (id === carousel.templateId) return;
    if (!confirm("Trocar a estrutura recria todos os slides (textos atuais serão perdidos). Continuar?")) return;
    onChange({ ...carousel, templateId: id, slides: getStructure(id).build() });
    setIndex(0);
  };

  const doExport = async () => {
    setExporting("Preparando…");
    try {
      await exportCarousel(carousel, kit, (done, total) => setExporting(`Slide ${done}/${total}`));
    } catch (err) {
      alert(`Falha no export: ${err}`);
    } finally {
      setExporting(null);
    }
  };

  const pal = effectiveColors(slide, kit);
  const slideCount = carousel.slides.length;

  return (
    <div className="flex h-screen flex-col">
      {/* barra superior */}
      <header className="flex items-center gap-3 border-b border-white/8 bg-zinc-950/80 px-4 py-2.5">
        <Btn onClick={onBack} title="Voltar pra biblioteca">
          <ArrowLeft size={14} />
        </Btn>
        <input
          className="w-56 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-zinc-100 outline-none hover:border-white/10 focus:border-violet-500/60"
          value={carousel.name}
          onChange={(e) => onChange({ ...carousel, name: e.target.value })}
        />
        <div className="ml-auto flex items-center gap-2">
          {(slideCount < 7 || slideCount > 10) && (
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-300" title="Guia: carrosséis virais têm 7–10 slides">
              {slideCount} slides (guia: 7–10)
            </span>
          )}
          <Btn onClick={onSaveAsTemplate} title="Salvar layout atual como template reutilizável">
            <Bookmark size={14} /> Salvar como template
          </Btn>
          <Btn variant="primary" onClick={doExport} disabled={!!exporting}>
            <Download size={14} /> {exporting ?? "Exportar carrossel"}
          </Btn>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* coluna de controle */}
        <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-white/8 bg-zinc-950/60">
          <Section title="Estrutura">
            <Select
              value={carousel.templateId}
              onChange={changeStructure}
              options={[
                ...STRUCTURES.map((s) => ({ value: s.id, label: s.name })),
                ...(STRUCTURES.some((s) => s.id === carousel.templateId)
                  ? []
                  : [{ value: carousel.templateId, label: `Personalizada (${carousel.templateId})` }]),
              ]}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
              {STRUCTURES.find((s) => s.id === carousel.templateId)?.framework ?? "layout próprio"}
            </p>
          </Section>

          <IdentityPanel kit={kit} onUpdateKit={onUpdateCustomKit} onCreateKit={onCreateCustomKit} />

          <LogoUploader logo={carousel.logo} onChange={(logo) => onChange({ ...carousel, logo })} />

          {carousel.logo.src && (
            <Section
              title={`Logo no slide ${safeIndex + 1}`}
              right={
                slide.logoOverride ? (
                  <button
                    type="button"
                    title="Voltar à posição padrão"
                    onClick={() => patchSlide(safeIndex, { logoOverride: undefined })}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-violet-300 hover:bg-white/10"
                  >
                    <RotateCcw size={11} /> padrão
                  </button>
                ) : undefined
              }
            >
              {slide.logoOverride ? (
                <>
                  <p className="mb-2 text-[11px] text-zinc-500">
                    Posição própria neste slide. Arraste o logo na prévia (modo manual) ou ajuste abaixo.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="X">
                      <NumberInput value={slide.logoOverride.x} onChange={(x) => patchSlide(safeIndex, { logoOverride: { ...slide.logoOverride!, x } })} />
                    </Field>
                    <Field label="Y">
                      <NumberInput value={slide.logoOverride.y} onChange={(y) => patchSlide(safeIndex, { logoOverride: { ...slide.logoOverride!, y } })} />
                    </Field>
                  </div>
                  <Field label={`Tamanho — ${Math.round((slide.logoOverride.scale ?? carousel.logo.scale ?? 1) * 100)}%`}>
                    <input
                      type="range"
                      min={0.4}
                      max={2.5}
                      step={0.05}
                      value={slide.logoOverride.scale ?? carousel.logo.scale ?? 1}
                      onChange={(e) => patchSlide(safeIndex, { logoOverride: { ...slide.logoOverride!, scale: Number(e.target.value) } })}
                      className="w-full"
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-xs text-zinc-300">
                    <input
                      type="checkbox"
                      checked={slide.logoOverride.show !== false}
                      onChange={(e) => patchSlide(safeIndex, { logoOverride: { ...slide.logoOverride!, show: e.target.checked } })}
                    />
                    Mostrar neste slide
                  </label>
                </>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] text-zinc-500">Herdando a posição padrão.</p>
                  <Btn
                    onClick={() =>
                      patchSlide(safeIndex, {
                        logoOverride: { x: 80, y: 80, scale: carousel.logo.scale ?? 1, show: true },
                      })
                    }
                    title="Dar posição própria a este slide"
                  >
                    <Move size={12} /> Posição própria
                  </Btn>
                </div>
              )}
            </Section>
          )}

          <FramePanel frame={carousel.frame} onChange={(frame) => onChange({ ...carousel, frame })} />

          <CounterPanel counter={carousel.counter} onChange={(counter) => onChange({ ...carousel, counter })} />

          <Section
            title={`Cor do slide ${safeIndex + 1}`}
            right={
              <button
                type="button"
                title={slide.colors.locked ? "Destravar cores deste slide" : "Voltar às cores da marca"}
                onClick={() =>
                  patchSlide(safeIndex, {
                    colors: slide.colors.locked
                      ? { locked: false, bg: pal.bg, text: pal.text, accent: pal.accent }
                      : { locked: true },
                  })
                }
                className="rounded-md p-1 text-zinc-400 hover:bg-white/10"
              >
                {slide.colors.locked ? <Lock size={13} /> : <Unlock size={13} className="text-emerald-300" />}
              </button>
            }
          >
            {slide.colors.locked ? (
              <p className="text-[11px] text-zinc-500">Herdando as cores da marca. Clique no cadeado pra destravar só este slide.</p>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                <Field label="Fundo">
                  <ColorInput value={slide.colors.bg ?? pal.bg} onChange={(bg) => patchSlide(safeIndex, { colors: { ...slide.colors, bg } })} />
                </Field>
                <Field label="Texto">
                  <ColorInput value={slide.colors.text ?? pal.text} onChange={(text) => patchSlide(safeIndex, { colors: { ...slide.colors, text } })} />
                </Field>
                <Field label="Acento">
                  <ColorInput value={slide.colors.accent ?? pal.accent} onChange={(accent) => patchSlide(safeIndex, { colors: { ...slide.colors, accent } })} />
                </Field>
              </div>
            )}
          </Section>

          {/* alternador de modo */}
          <div className="sticky top-0 z-10 flex gap-1 border-b border-white/8 bg-zinc-950/95 p-2 backdrop-blur">
            <button
              type="button"
              onClick={() => {
                setManualMode(false);
                setSelectedId(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium ${
                !manualMode ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              <Wand2 size={13} /> Estruturado
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium ${
                manualMode ? "bg-cyan-600 text-white" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              <Pencil size={13} /> Ajuste manual
            </button>
          </div>

          {manualMode ? (
            <ManualInspector
              slide={slide}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPatchElement={patchElement}
              onReplaceElements={replaceElements}
            />
          ) : (
            <StructuredForm
              slide={slide}
              onPatchElement={patchElement}
              onPatchSlide={(patch) => patchSlide(safeIndex, patch)}
            />
          )}
        </aside>

        {/* prévia */}
        <main className="flex min-w-0 flex-1 flex-col bg-zinc-900/40">
          <Preview
            carousel={carousel}
            kit={kit}
            index={safeIndex}
            setIndex={setIndex}
            manualMode={manualMode}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPatchElement={patchElement}
            onMoveLogo={(x, y) =>
              patchSlide(safeIndex, {
                logoOverride: { ...(slide.logoOverride ?? { show: true }), x, y },
              })
            }
          />
          <Filmstrip
            carousel={carousel}
            kit={kit}
            index={safeIndex}
            setIndex={setIndex}
            onDuplicate={duplicateSlide}
            onDelete={deleteSlide}
            onMove={moveSlide}
          />
        </main>
      </div>
    </div>
  );
}
