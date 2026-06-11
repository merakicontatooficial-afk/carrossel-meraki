import type { Element, Slide, TextRole } from "../../types";
import { checkText } from "../../config/guardrails";
import { ACTION_PRESETS, SWIPE_PRESETS, clampCtaY, type CtaPreset } from "../../config/cta";
import { Field, FileButton, Section, Select, TextArea, Btn } from "../ui";
import { ImagePlus, Trash2 } from "lucide-react";

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

export default function StructuredForm({ slide, onPatchElement, onPatchSlide }: Props) {
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
      <Section title="Textos do slide">
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
        <Section title="Imagens">
          {imageEls.map((el, i) => (
            <div key={el.id} className="mb-2 flex items-center gap-2">
              {el.src ? (
                <img src={el.src} alt="" className="h-10 w-14 rounded object-cover" />
              ) : (
                <div className="flex h-10 w-14 items-center justify-center rounded border border-dashed border-white/15 text-zinc-500">
                  <ImagePlus size={14} />
                </div>
              )}
              <FileButton
                label={el.src ? `Trocar imagem ${imageEls.length > 1 ? i + 1 : ""}` : "Subir imagem"}
                onFile={(src) => onPatchElement(el.id, { src })}
              />
              {el.src && (
                <Btn variant="danger" onClick={() => onPatchElement(el.id, { src: undefined })} title="Remover">
                  <Trash2 size={13} />
                </Btn>
              )}
            </div>
          ))}
        </Section>
      )}

      {ctaEls.length > 0 && (
        <Section title="Botão / CTA">
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

      <Section title="Fundo do slide">
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
          <Field label={`Escurecer p/ legibilidade — ${slide.scrim ?? 65}%`}>
            <input
              type="range"
              min={0}
              max={100}
              value={slide.scrim ?? 65}
              onChange={(e) => onPatchSlide({ scrim: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
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
