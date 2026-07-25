import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, Element, Slide } from "../../types";
import { effectiveColors } from "../../lib/resolve";
import { autoLayout } from "../../lib/aiCarousel";
import { cloneSlides } from "../../lib/clone";
import { exportCarousel } from "../../lib/export";
import { api } from "../../lib/api";
import { Btn, ColorInput, Field, NumberInput, Section } from "../ui";
import IdentityPanel from "./IdentityPanel";
import LogoUploader from "./LogoUploader";
import FramePanel from "./FramePanel";
import CounterPanel from "./CounterPanel";
import StructuredForm from "./StructuredForm";
import ManualInspector from "./ManualInspector";
import Preview from "./Preview";
import Filmstrip from "./Filmstrip";
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight, Copy, Download, FileText, Grid3x3, ImageIcon, Loader2, Lock, Move, Pencil, Plus, Redo2, RotateCcw, Sparkles, Trash2, Undo2, Unlock, Wand2, X } from "lucide-react";

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
  onChange: applyChange,
  onUpdateCustomKit,
  onCreateCustomKit,
  onSaveAsTemplate,
  onBack,
}: Props) {
  const [index, setIndexRaw] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  // histórico p/ desfazer/refazer — como TODA edição passa por `onChange`, basta
  // envolver aqui: empilha o estado atual antes de aplicar o próximo.
  const history = useRef<{ past: Carousel[]; future: Carousel[] }>({ past: [], future: [] });
  const onChange = (next: Carousel) => {
    const h = history.current;
    h.past.push(carousel);
    if (h.past.length > 60) h.past.shift();
    h.future = [];
    applyChange(next);
  };
  const undo = () => {
    const h = history.current;
    const prev = h.past.pop();
    if (prev) { h.future.push(carousel); applyChange(prev); }
  };
  const redo = () => {
    const h = history.current;
    const nxt = h.future.pop();
    if (nxt) { h.past.push(carousel); applyChange(nxt); }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carousel]);
  const [manualMode, setManualMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState<string | null>(null);
  const [imgPrompt, setImgPrompt] = useState("");
  const [refineInstr, setRefineInstr] = useState("");
  const [caption, setCaption] = useState<string | null>(null);

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

  const doExportOne = async () => {
    setExporting("Baixando slide…");
    try {
      await exportCarousel({ ...carousel, slides: [slide] }, kit);
    } catch (err) {
      alert(`Falha no export: ${err}`);
    } finally {
      setExporting(null);
    }
  };

  // texto principal de um slide (headline/body) — para IA e legenda
  const slideText = (s: Slide) => ({
    headline: s.elements.find((e) => e.role === "headline")?.text ?? "",
    body: s.elements.find((e) => e.role === "body")?.text ?? "",
  });

  const genImage = async () => {
    setAiBusy("Gerando imagem…");
    try {
      const prompt = imgPrompt.trim() || slideText(slide).headline || carousel.name;
      const img = await api.generateImage({ prompt });
      patchSlide(safeIndex, { bgImage: img.dataUrl, bgScale: 1, scrim: slide.scrim ?? 70 });
      setImgPrompt("");
    } catch (e) {
      alert("Falha ao gerar imagem: " + (e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  // gera imagem por IA DENTRO de um elemento de imagem (cartão/retângulo) — não só fundo
  const genImageElement = async (elId: string, prompt?: string) => {
    setAiBusy("Gerando imagem…");
    try {
      const p = (prompt ?? "").trim() || imgPrompt.trim() || slideText(slide).headline || carousel.name;
      const img = await api.generateImage({ prompt: p });
      patchElement(elId, { src: img.dataUrl });
    } catch (e) {
      alert("Falha ao gerar imagem: " + (e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  // reorganiza o slide atual (packing por texto + posição topo/base da imagem)
  const doAutoLayout = (imgPos?: "top" | "base") => {
    const src = imgPos ? { ...slide, imgPos } : slide;
    patchSlide(safeIndex, { elements: autoLayout(src, imgPos), ...(imgPos ? { imgPos } : {}) });
  };

  const refineHeadline = async () => {
    const hEl = slide.elements.find((e) => e.role === "headline");
    if (!hEl || !refineInstr.trim()) return;
    setAiBusy("Refinando…");
    try {
      const { texto } = await api.refineSlide({ texto: hEl.text ?? "", instrucao: refineInstr });
      patchElement(hEl.id, { text: texto });
      setRefineInstr("");
    } catch (e) {
      alert("Falha ao refinar: " + (e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  const genCaption = async () => {
    setAiBusy("Gerando legenda…");
    try {
      const slides = carousel.slides.map((s) => ({ kind: (s.kind ?? "value") as "cover" | "value" | "proof" | "cta", ...slideText(s) }));
      const { legenda } = await api.generateCaption({ slides });
      setCaption(legenda);
    } catch (e) {
      alert("Falha ao gerar legenda: " + (e as Error).message);
    } finally {
      setAiBusy(null);
    }
  };

  const pal = effectiveColors(slide, kit);
  const slideCount = carousel.slides.length;

  return (
    <div className="flex h-screen flex-col">
      {/* barra superior — Estúdio */}
      <header className="flex items-center gap-3 border-b border-white/10 bg-black px-4 py-2.5">
        <button className="btn !min-h-0 !py-2 !px-3" onClick={onBack} title="Voltar ao Dashboard">
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span className="text-sm font-semibold text-white">Estúdio</span>
        <input
          className="w-44 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-white outline-none hover:border-white/10 focus:border-[var(--glass-brd-h)]"
          value={carousel.name}
          onChange={(e) => onChange({ ...carousel, name: e.target.value })}
        />
        <span className="rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-[var(--text-md)]">Carrossel · 4:5</span>
        <div className="flex items-center gap-1">
          <button className="icon-btn btn" onClick={undo} title="Desfazer (Ctrl+Z)"><Undo2 size={15} /></button>
          <button className="icon-btn btn" onClick={redo} title="Refazer (Ctrl+Shift+Z)"><Redo2 size={15} /></button>
          <button className={`icon-btn btn ${showGrid ? "!border-transparent !bg-[var(--brand-sat)] !text-white" : ""}`} onClick={() => setShowGrid((g) => !g)} title="Grade de posicionamento"><Grid3x3 size={15} /></button>
        </div>

        {/* navegação de slides (centro) */}
        <div className="mx-auto flex items-center gap-1">
          <button className="icon-btn btn" onClick={() => setIndex(Math.max(0, safeIndex - 1))} disabled={safeIndex === 0} title="Anterior"><ChevronLeft size={16} /></button>
          <span className="px-2 text-xs text-[var(--text-md)]">Slide {safeIndex + 1} de {slideCount}</span>
          <button className="icon-btn btn" onClick={() => setIndex(Math.min(slideCount - 1, safeIndex + 1))} disabled={safeIndex >= slideCount - 1} title="Próximo"><ChevronRight size={16} /></button>
          <button className="icon-btn btn ml-1" onClick={() => duplicateSlide(safeIndex)} title="Adicionar slide (duplica o atual)"><Plus size={16} /></button>
          <button className="icon-btn btn btn-danger" onClick={() => deleteSlide(safeIndex)} disabled={slideCount <= 1} title="Excluir slide"><Trash2 size={15} /></button>
        </div>

        {/* ações (direita) */}
        <div className="flex items-center gap-2">
          <button className="btn" onClick={doExportOne} disabled={!!exporting} title="Baixar só este slide"><Download size={14} /> Baixar slide</button>
          <button className="btn" onClick={doExport} disabled={!!exporting}><Download size={14} /> {exporting ?? "Baixar todos"}</button>
          <button className="btn" onClick={onSaveAsTemplate} title="Salvar como template"><Bookmark size={14} /> Salvar</button>
          <button className="btn btn-primary" onClick={genCaption} disabled={!!aiBusy}><FileText size={14} /> Gerar Legenda</button>
        </div>
      </header>

      {/* modal da legenda gerada */}
      {caption !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCaption(null)}>
          <div className="glass w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={18} className="text-[var(--brand-hi)]" />
              <h3 className="mr-auto text-sm font-semibold text-white">Legenda do post</h3>
              <button onClick={() => setCaption(null)} className="text-[var(--text-lo)] hover:text-white"><X size={18} /></button>
            </div>
            <textarea readOnly value={caption} rows={7} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
            <div className="mt-3 flex justify-end">
              <button className="btn btn-primary" onClick={() => { navigator.clipboard?.writeText(caption); }}><Copy size={14} /> Copiar</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* coluna de controle */}
        <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-white/10 bg-black">
          {/* alternador de modo */}
          <div className="sticky top-0 z-20 flex gap-1 border-b border-white/10 bg-black/95 p-2 backdrop-blur">
            <button
              type="button"
              onClick={() => { setManualMode(false); setSelectedId(null); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${!manualMode ? "bg-[var(--brand-sat)] text-white" : "text-[var(--text-md)] hover:bg-white/5"}`}
            >
              <Wand2 size={13} /> Estruturado
            </button>
            <button
              type="button"
              onClick={() => setManualMode(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition ${manualMode ? "bg-white/12 text-white" : "text-[var(--text-md)] hover:bg-white/5"}`}
            >
              <Pencil size={13} /> Ajuste manual
            </button>
          </div>

          <div className="px-4 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-lo)]">Slide atual</div>

          {manualMode ? (
            <ManualInspector
              slide={slide}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onPatchElement={patchElement}
              onReplaceElements={replaceElements}
              onGenerateImageEl={genImageElement}
              aiBusy={!!aiBusy}
            />
          ) : (
            <StructuredForm
              slide={slide}
              onPatchElement={patchElement}
              onPatchSlide={(patch) => patchSlide(safeIndex, patch)}
              onGenerateImageEl={genImageElement}
              onAutoLayout={doAutoLayout}
              aiBusy={!!aiBusy}
            />
          )}

          <Section title="IA · slide atual" icon={<Sparkles size={15} />} defaultOpen>
            <Field label="Gerar imagem de fundo com IA">
              <input
                value={imgPrompt}
                onChange={(e) => setImgPrompt(e.target.value)}
                placeholder="Descreva a imagem (ou deixe vazio p/ usar o título)"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]"
              />
            </Field>
            <button className="btn btn-primary w-full" onClick={genImage} disabled={!!aiBusy}>
              <ImageIcon size={14} /> Gerar imagem
            </button>
            <div className="my-3 h-px bg-white/8" />
            <Field label="Refinar o título com IA">
              <input
                value={refineInstr}
                onChange={(e) => setRefineInstr(e.target.value)}
                placeholder="Ex.: deixa mais curto e agressivo"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]"
              />
            </Field>
            <button className="btn w-full" onClick={refineHeadline} disabled={!!aiBusy || !refineInstr.trim()}>
              <Sparkles size={14} /> Refinar título
            </button>
            {aiBusy && (
              <p className="mt-2 flex items-center gap-2 text-[11px] text-[var(--brand-hi)]">
                <Loader2 size={12} className="animate-spin" /> {aiBusy}
              </p>
            )}
          </Section>

          <div className="border-t border-white/10 px-4 pb-1 pt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-lo)]">Estilo global · todos os slides</div>

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

          {carousel.counter && carousel.counter.style !== "none" && (
            <Section
              title={`Marcador no slide ${safeIndex + 1}`}
              right={
                slide.counterOverride ? (
                  <button
                    type="button"
                    title="Voltar ao marcador padrão"
                    onClick={() => patchSlide(safeIndex, { counterOverride: undefined })}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-violet-300 hover:bg-white/10"
                  >
                    <RotateCcw size={11} /> padrão
                  </button>
                ) : undefined
              }
            >
              <label className="mb-2 flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={slide.counterOverride?.hide ?? false}
                  onChange={(e) =>
                    patchSlide(safeIndex, {
                      counterOverride: { ...(slide.counterOverride ?? {}), hide: e.target.checked },
                    })
                  }
                />
                Ocultar marcador neste slide
              </label>
              {slide.counterOverride && (slide.counterOverride.x != null || slide.counterOverride.y != null) ? (
                <div className="grid grid-cols-2 gap-2">
                  <Field label="X">
                    <NumberInput value={slide.counterOverride.x ?? 0} onChange={(x) => patchSlide(safeIndex, { counterOverride: { ...slide.counterOverride!, x } })} />
                  </Field>
                  <Field label="Y">
                    <NumberInput value={slide.counterOverride.y ?? 0} onChange={(y) => patchSlide(safeIndex, { counterOverride: { ...slide.counterOverride!, y } })} />
                  </Field>
                </div>
              ) : (
                !slide.counterOverride?.hide && (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-zinc-500">Posição igual ao padrão.</p>
                    <Btn
                      onClick={() =>
                        patchSlide(safeIndex, {
                          counterOverride: { ...(slide.counterOverride ?? {}), x: carousel.counter!.x ?? 420, y: carousel.counter!.y ?? 1250 },
                        })
                      }
                      title="Dar posição própria ao marcador neste slide"
                    >
                      <Move size={12} /> Posição própria
                    </Btn>
                  </div>
                )
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                No modo manual, arraste o marcador na prévia: sem posição própria, ele move em <b>todos</b> os slides; com posição própria, só neste.
              </p>
            </Section>
          )}

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

        </aside>

        {/* prévia */}
        <main className="flex min-w-0 flex-1 flex-col bg-[#0a0a0c]">
          <Preview
            carousel={carousel}
            kit={kit}
            index={safeIndex}
            setIndex={setIndex}
            manualMode={manualMode}
            showGrid={showGrid}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPatchElement={patchElement}
            onMoveLogo={(x, y) =>
              patchSlide(safeIndex, {
                logoOverride: { ...(slide.logoOverride ?? { show: true }), x, y },
              })
            }
            onMoveCounter={(x, y) => {
              // se o slide tem marcador próprio → move só ele; senão move global (todos)
              if (slide.counterOverride) {
                patchSlide(safeIndex, { counterOverride: { ...slide.counterOverride, x, y } });
              } else {
                onChange({ ...carousel, counter: { ...carousel.counter!, x, y } });
              }
            }}
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
