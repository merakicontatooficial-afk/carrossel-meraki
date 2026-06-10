import type { Element, Slide, TextRole } from "../../types";
import { checkText, countWords } from "../../config/guardrails";
import { Field, FileButton, Section, TextArea, Btn } from "../ui";
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
export default function StructuredForm({ slide, onPatchElement, onPatchSlide }: Props) {
  const textEls = slide.elements
    .filter((e) => e.type === "text" && e.role !== "logo" && e.role !== "index")
    .sort((a, b) => a.y - b.y);
  const imageEls = slide.elements.filter((e) => e.type === "image");

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
                onChange={(e) => {
                  const next = e.target.value;
                  // trava no modo estruturado: não deixa AUMENTAR além do limite
                  if (check.limit !== null) {
                    const nextCount = countWords(next);
                    if (nextCount > check.limit && nextCount > check.count) return;
                  }
                  onPatchElement(el.id, { text: next });
                }}
              />
            </Field>
          );
        })}
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
          Marcação: <code className="text-zinc-300">*acento*</code> ·{" "}
          <code className="text-zinc-300">_sublinhado_</code> ·{" "}
          <code className="text-zinc-300">==realce==</code>
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

      <Section title="Fundo do slide">
        <div className="flex items-center gap-2">
          {slide.bgImage && <img src={slide.bgImage} alt="" className="h-10 w-14 rounded object-cover" />}
          <FileButton
            label={slide.bgImage ? "Trocar fundo" : "Imagem de fundo"}
            onFile={(bgImage) => onPatchSlide({ bgImage })}
          />
          {slide.bgImage && (
            <Btn variant="danger" onClick={() => onPatchSlide({ bgImage: undefined })} title="Remover fundo">
              <Trash2 size={13} />
            </Btn>
          )}
        </div>
      </Section>
    </>
  );
}
