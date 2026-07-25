import type { Element, Slide, TextRole } from "../../types";
import { checkText } from "../../config/guardrails";
import { ACTION_PRESETS, SWIPE_PRESETS, clampCtaY, type CtaPreset } from "../../config/cta";
import { Field, FileButton, Section, Select, TextArea, Btn, SliderField } from "../ui";
import { ImagePlus, Trash2, Type, Image as ImageIcon, MousePointerClick, Sparkles, AlignVerticalSpaceAround, ArrowUpToLine, ArrowDownToLine } from "lucide-react";

const ROLE_LABELS: Record<TextRole, string> = {
  eyebrow: "Eyebrow",
  headline: "Headline",
  body: "Corpo",
  "cta-primary": "CTA principal",
  "cta-secondary": "CTA secundário",
  index: "Índice",
  logo: "Logo (texto)",
};

interface Props {
  slide: Slide;
  onPatchElement: (elId: string, patch: Partial<Element>) => void;
  onPatchSlide: (patch: Partial<Slide>) => void;
  onGenerateImageEl?: (elId: string) => void;
  onAutoLayout?: (imgPos?: "top" | "base") => void;
  aiBusy?: boolean;
}

/**
 * Modo Estruturado: só os textos por papel + imagens. Guardrails ativos —
 * o limite de palavras trava a digitação além do teto.
 */
function presetMatch(el: Element, presets: CtaPreset[]): string {
  const found = presets.find(
    (p) => p.patch.ctaVariant === (el.ctaVariant ?? "text") && (p.patch.ctaIcon ?? "none") === (el.ctaIcon ?? "none")
  );
  return found?.id ?? "";
}

export default function StructuredForm({ slide, onPatchElement, onPatchSlide, onGenerateImageEl, onAutoLayout, aiBusy }: Props) {
  const textEls = slide.elements
    .filter((e) => e.type === "text" && e.role !== "logo" && e.role !== "index")
    .sort((a, b) => a.y - b.y);
  const imageEls = slide.elements.filter((e) => e.type === "image");
  const ctaEls = slide.elements
    .filter((e) => e.type === "text" && (e.role === "cta-primary" || e.role === "cta-secondary"))
    .sort((a, b) => a.y - b.y);

  const applyPreset = (el: Element, preset: CtaPreset) => {
    const patch = { ...preset.patch };
    if (el.role === "cta-secondary" && patch.h != null) patch.y = clampCtaY(el.y, patch.h);
    onPatchElement(el.id, patch);
  };

  return (
    <>
      <Section title="Texto & IA" icon={<Type size={15} />} defaultOpen>
        {textEls.length === 0 && <p className="text-xs text-zinc-500">Este slide não tem textos editáveis.</p>}
        {textEls.map((el) => {
          const check = checkText(el.role, el.text ?? "");
          return (
            <Field
              key={el.id}
              label={el.role ? ROLE_LABELS[el.role] : "Texto"}
              hint={
                check.limit !== null && (
                  <span className={check.over ? "font-semibold text-amber-400" : "text-zinc-500"}>
                    {check.count}/{check.limit} palavras
                  </span>
                )
              }
            >
              <TextArea
                value={el.text ?? ""}
                className={check.over ? "border-amber-500/60" : ""}
                onChange={(e) => onPatchElement(el.id, { text: e.target.value })}
              />
              {check.over && (
                <p className="-mt-2 mb-2 text-[11px] text-amber-400/90">
                  Acima do guia viral — ok se for proposital, mas frases curtas prendem mais.
                </p>
              )}
            </Field>
          );
        })}
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Marcação: <code className="text-zinc-300">*acento*</code> ·{" "}
          <code className="text-zinc-300">==realce==</code> ·{" "}
          <code className="text-zinc-300">_sublinhado_</code> ·{" "}
          <code className="text-zinc-300">~suave~</code>
        </p>
      </Section>

      {imageEls.length > 0 && (
        <Section title="Cartão de Imagem" icon={<ImageIcon size={15} />} defaultOpen>
          {/* posição do cartão + reorganização automática do slide */}
          {onAutoLayout && (
            <div className="mb-3">
              <div className="mb-1 text-xs text-[var(--text-md)]">Posição da imagem no slide</div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => onAutoLayout("top")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs ${slide.imgPos === "top" ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/15 text-white" : "border-white/10 text-[var(--text-md)] hover:text-white"}`}
                >
                  <ArrowUpToLine size={13} /> Topo
                </button>
                <button
                  type="button"
                  onClick={() => onAutoLayout("base")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs ${(slide.imgPos ?? "base") === "base" ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/15 text-white" : "border-white/10 text-[var(--text-md)] hover:text-white"}`}
                >
                  <ArrowDownToLine size={13} /> Base
                </button>
              </div>
              <button type="button" onClick={() => onAutoLayout()} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 px-2 py-2 text-xs text-[var(--text-md)] hover:text-white">
                <AlignVerticalSpaceAround size={13} /> Auto-organizar layout
              </button>
            </div>
          )}
          {imageEls.map((el, i) => (
            <div key={el.id} className="mb-3 rounded-lg border border-white/8 p-2">
              <div className="mb-2 flex items-center gap-2">
                {el.src ? (
                  <img src={el.src} alt="" className="h-10 w-14 rounded object-cover" />
                ) : (
                  <div className="flex h-10 w-14 items-center justify-center rounded border border-dashed border-white/15 text-zinc-500">
                    <ImagePlus size={14} />
                  </div>
                )}
                <FileButton
                  label={el.src ? `Trocar ${imageEls.length > 1 ? i + 1 : ""}` : "Subir imagem"}
                  onFile={(src) => onPatchElement(el.id, { src })}
                />
                {el.src && (
                  <Btn variant="danger" onClick={() => onPatchElement(el.id, { src: undefined })} title="Remover">
                    <Trash2 size={13} />
                  </Btn>
                )}
              </div>
              {onGenerateImageEl && (
                <button type="button" onClick={() => onGenerateImageEl(el.id)} disabled={aiBusy} className="btn btn-primary mb-2 w-full !py-2 text-xs">
                  <Sparkles size={13} /> Gerar imagem com IA
                </button>
              )}
              {el.src && (
                <>
                  <SliderField label={`Zoom — ${Math.round((el.imgScale ?? 1) * 100)}%`} value={el.imgScale ?? 1} min={1} max={3} step={0.02} onChange={(v) => onPatchElement(el.id, { imgScale: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <SliderField label="Mover ⇆" value={el.imgPosX ?? 0} min={-50} max={50} onChange={(v) => onPatchElement(el.id, { imgPosX: v })} />
                    <SliderField label="Mover ⇅" value={el.imgPosY ?? 0} min={-50} max={50} onChange={(v) => onPatchElement(el.id, { imgPosY: v })} />
                  </div>
                </>
              )}
            </div>
          ))}
        </Section>
      )}

      {ctaEls.length > 0 && (
        <Section title="Botão / CTA" icon={<MousePointerClick size={15} />}>
          {ctaEls.map((el) => {
            const isSwipe = el.role === "cta-secondary";
            const presets = isSwipe ? SWIPE_PRESETS : ACTION_PRESETS;
            const current = presetMatch(el, presets);
            return (
              <Field key={el.id} label={isSwipe ? "Botão de passar (swipe)" : "Botão de ação"}>
                <Select
                  value={current}
                  onChange={(id) => {
                    const p = presets.find((x) => x.id === id);
                    if (p) applyPreset(el, p);
                  }}
                  options={[
                    ...(current ? [] : [{ value: "", label: "Personalizado…" }]),
                    ...presets.map((p) => ({ value: p.id, label: p.label })),
                  ]}
                />
              </Field>
            );
          })}
          <p className="text-[11px] leading-relaxed text-zinc-500">
            O texto do botão você edita lá em cima. Aqui escolhe o estilo (pílula, contorno) e o ícone.
          </p>
        </Section>
      )}

      <Section title="Imagem de Fundo" icon={<ImageIcon size={15} />}>
        <div className="flex items-center gap-2">
          {slide.bgImage && <img src={slide.bgImage} alt="" className="h-10 w-14 rounded object-cover" />}
          <FileButton
            label={slide.bgImage ? "Trocar foto" : "Foto de fundo"}
            onFile={(bgImage) => onPatchSlide({ bgImage, scrim: slide.scrim ?? 65 })}
          />
          {slide.bgImage && (
            <Btn variant="danger" onClick={() => onPatchSlide({ bgImage: undefined })} title="Remover fundo">
              <Trash2 size={13} />
            </Btn>
          )}
        </div>
        {slide.bgImage && (
          <>
            <Field label={`Zoom da foto — ${Math.round((slide.bgScale ?? 1) * 100)}%`}>
              <input
                type="range"
                min={1}
                max={3}
                step={0.02}
                value={slide.bgScale ?? 1}
                onChange={(e) => onPatchSlide({ bgScale: Number(e.target.value) })}
                className="w-full"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={`Mover ⇆ — ${slide.bgPosX ?? 0}`}>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={slide.bgPosX ?? 0}
                  onChange={(e) => onPatchSlide({ bgPosX: Number(e.target.value) })}
                  className="w-full"
                />
              </Field>
              <Field label={`Mover ⇅ — ${slide.bgPosY ?? 0}`}>
                <input
                  type="range"
                  min={-50}
                  max={50}
                  value={slide.bgPosY ?? 0}
                  onChange={(e) => onPatchSlide({ bgPosY: Number(e.target.value) })}
                  className="w-full"
                />
              </Field>
            </div>
            {(slide.bgScale ?? 1) !== 1 || (slide.bgPosX ?? 0) !== 0 || (slide.bgPosY ?? 0) !== 0 ? (
              <button
                type="button"
                onClick={() => onPatchSlide({ bgScale: 1, bgPosX: 0, bgPosY: 0 })}
                className="mb-2 text-[11px] text-violet-300 hover:underline"
              >
                Resetar enquadramento
              </button>
            ) : null}
            <div className="mb-1 mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-lo)]">Escurecimento</div>
            <Field label={`Escurecer a imagem (véu) — ${slide.scrimVeil ?? 0}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={slide.scrimVeil ?? 0}
                onChange={(e) => onPatchSlide({ scrimVeil: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-[11px] text-[var(--text-lo)]">Escurece a foto INTEIRA por igual. 100% = preto.</p>
            </Field>
            <Field label={`Escurecer o degradê da base — ${slide.scrim ?? 65}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={slide.scrim ?? 65}
                onChange={(e) => onPatchSlide({ scrim: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-[11px] text-[var(--text-lo)]">Só o degradê de baixo (onde fica o texto). 100% = base preta.</p>
            </Field>
            <Field label={`Altura do degradê da base — ${slide.scrimPos ?? 52}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={slide.scrimPos ?? 52}
                onChange={(e) => onPatchSlide({ scrimPos: Number(e.target.value) })}
                className="w-full"
              />
              <p className="mt-1 text-[11px] text-[var(--text-lo)]">Quanto o degradê sobe. Acima disso a foto fica intacta.</p>
            </Field>
          </>
        )}
        {!slide.bgImage && (
          <p className="mt-2 text-[11px] text-zinc-500">
            Suba uma foto cinematográfica pra um slide no estilo viral (texto sobre a imagem).
          </p>
        )}
      </Section>
    </>
  );
}
