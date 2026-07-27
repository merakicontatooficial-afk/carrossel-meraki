import type { ColorToken, Element, Slide } from "../../types";
import { uid, CANVAS_W, CANVAS_H, SAFE_MARGIN } from "../../types";
import { checkText } from "../../config/guardrails";
import { Btn, ColorInput, Field, FileButton, SliderField, Section, Select, TextArea } from "../ui";
import AiImageBox, { type AiImageInput } from "./AiImageBox";
import {
  ArrowDown,
  ArrowUp,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Heart,
  Highlighter,
  ImagePlus,
  Minus,
  Sparkles,
  Square,
  Trash2,
  Type,
} from "lucide-react";

/** Pesos disponíveis (as famílias do app cobrem 100–900; o navegador sintetiza o que faltar). */
export const WEIGHTS = [
  { value: "100", label: "100 · Thin" },
  { value: "200", label: "200 · ExtraLight" },
  { value: "300", label: "300 · Light" },
  { value: "400", label: "400 · Regular" },
  { value: "500", label: "500 · Medium" },
  { value: "600", label: "600 · SemiBold" },
  { value: "700", label: "700 · Bold" },
  { value: "800", label: "800 · ExtraBold" },
  { value: "900", label: "900 · Black" },
];

const TOKEN_OPTIONS = [
  { value: "accent", label: "Acento (marca)" },
  { value: "text", label: "Texto (marca)" },
  { value: "bg", label: "Fundo (marca)" },
  { value: "muted", label: "Suave (marca)" },
  { value: "surface", label: "Superfície (marca)" },
  { value: "__custom", label: "Cor personalizada…" },
];

function TokenColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ColorToken | undefined;
  onChange: (v: ColorToken) => void;
}) {
  const isToken = ["accent", "text", "bg", "muted", "surface"].includes(value ?? "");
  return (
    <Field label={label}>
      <Select
        value={isToken ? (value as string) : "__custom"}
        onChange={(v) => onChange(v === "__custom" ? "#ffffff" : v)}
        options={TOKEN_OPTIONS}
      />
      {!isToken && (
        <div className="mt-2">
          <ColorInput value={value ?? "#ffffff"} onChange={onChange} />
        </div>
      )}
    </Field>
  );
}

interface Props {
  slide: Slide;
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onPatchElement: (elId: string, patch: Partial<Element>) => void;
  onReplaceElements: (elements: Element[]) => void;
  onGenerateImageEl?: (elId: string, input?: AiImageInput) => void;
  aiBusy?: boolean;
}

/** Modo Manual: autonomia total sobre o elemento selecionado. Guardrails viram avisos. */
export default function ManualInspector({ slide, selectedId, selectedIds, onSelect, onPatchElement, onReplaceElements, onGenerateImageEl, aiBusy }: Props) {
  const selIds = selectedIds ?? (selectedId ? [selectedId] : []);
  const el = slide.elements.find((e) => e.id === selectedId) ?? null;
  const sorted = [...slide.elements].sort((a, b) => b.z - a.z);

  const addElement = (partial: Partial<Element> & Pick<Element, "type">) => {
    const maxZ = Math.max(0, ...slide.elements.map((e) => e.z));
    const nu: Element = {
      id: uid(),
      x: SAFE_MARGIN,
      y: 500,
      w: CANVAS_W - 2 * SAFE_MARGIN,
      h: 120,
      z: maxZ + 1,
      ...partial,
    };
    onReplaceElements([...slide.elements, nu]);
    onSelect(nu.id);
  };

  const remove = () => {
    if (!el) return;
    onReplaceElements(slide.elements.filter((e) => e.id !== el.id));
    onSelect(null);
  };

  const duplicate = () => {
    if (!el) return;
    const maxZ = Math.max(0, ...slide.elements.map((e) => e.z));
    const copy: Element = { ...el, id: uid(), x: el.x + 40, y: el.y + 40, z: maxZ + 1 };
    onReplaceElements([...slide.elements, copy]);
    onSelect(copy.id);
  };

  const moveZ = (dir: "up" | "down" | "front" | "back") => {
    if (!el) return;
    const zs = slide.elements.map((e) => e.z);
    if (dir === "front") onPatchElement(el.id, { z: Math.max(...zs) + 1 });
    else if (dir === "back") onPatchElement(el.id, { z: Math.min(...zs) - 1 });
    else {
      const others = slide.elements.filter((e) => e.id !== el.id);
      const next =
        dir === "up"
          ? others.filter((e) => e.z > el.z).sort((a, b) => a.z - b.z)[0]
          : others.filter((e) => e.z < el.z).sort((a, b) => b.z - a.z)[0];
      if (next) {
        onPatchElement(el.id, { z: next.z });
        onPatchElement(next.id, { z: el.z });
      }
    }
  };

  const textCheck = el?.type === "text" ? checkText(el.role, el.text ?? "") : null;

  return (
    <>
      <Section
        title="Elementos"
        right={
          <div className="flex gap-1">
            <Btn title="Adicionar texto" onClick={() => addElement({ type: "text", text: "Novo texto", fontRole: "body", fontSize: 44, color: "text", lineHeight: 1.3 })}>
              <Type size={13} />
            </Btn>
            <Btn title="Adicionar imagem" onClick={() => addElement({ type: "image", fit: "cover", radius: 24, shadow: true, h: 400 })}>
              <ImagePlus size={13} />
            </Btn>
            <Btn title="Adicionar retângulo" onClick={() => addElement({ type: "shape", shape: "rect", fill: "accent", h: 200, w: 300 })}>
              <Square size={13} />
            </Btn>
            <Btn title="Adicionar linha" onClick={() => addElement({ type: "shape", shape: "line", fill: "accent", h: 10, w: 200 })}>
              <Minus size={13} />
            </Btn>
            <Btn title="Adicionar barra social (curtir/comentar/salvar/enviar)" onClick={() => addElement({ type: "social", color: "text", h: 90, w: CANVAS_W - 2 * SAFE_MARGIN, gap: 56, align: "left" })}>
              <Heart size={13} />
            </Btn>
          </div>
        }
      >
        {selIds.length > 1 && (
          <p className="mb-2 rounded-md bg-[var(--brand-sat)]/20 px-2 py-1.5 text-[11px] text-[var(--brand-hi)]">
            {selIds.length} elementos selecionados — Ctrl+C / Ctrl+V copiam o grupo (inclusive p/ outro slide).
          </p>
        )}
        <ul className="space-y-1">
          {sorted.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                title="Shift/Ctrl + clique para selecionar vários"
                onClick={(ev) => {
                  const additive = ev.shiftKey || ev.ctrlKey || ev.metaKey;
                  if (additive) onSelect(e.id, true);
                  else onSelect(selIds.length === 1 && e.id === selectedId ? null : e.id);
                }}
                className={`w-full truncate rounded-md px-2 py-1 text-left text-xs ${
                  selIds.includes(e.id) ? "bg-[var(--brand-sat)]/25 text-white" : "text-[var(--text-md)] hover:bg-white/5"
                }`}
              >
                {e.type === "text"
                  ? `📝 ${(e.role ?? "texto").toUpperCase()} · ${(e.text ?? "").slice(0, 28) || "(vazio)"}`
                  : e.type === "image"
                    ? `🖼️ imagem${e.src ? "" : " (vazia)"}`
                    : e.type === "social"
                      ? "❤️ barra social"
                      : `▪️ ${e.shape === "line" ? "linha" : "retângulo"}`}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {!el && (
        <Section title="Inspetor">
          <p className="text-xs leading-relaxed text-zinc-500">
            Clique num elemento na prévia (ou na lista acima) para editar tamanho, fonte, cor, posição e camada.
            Arraste para mover; use os cantos para redimensionar.
          </p>
        </Section>
      )}

      {el && (
        <Section
          title={`Inspetor — ${el.type === "text" ? "texto" : el.type === "image" ? "imagem" : "forma"}`}
          right={
            <div className="flex gap-1">
              <Btn title="Duplicar" onClick={duplicate}>
                <Copy size={13} />
              </Btn>
              <Btn title="Excluir" variant="danger" onClick={remove}>
                <Trash2 size={13} />
              </Btn>
            </div>
          }
        >
          {el.type === "text" && (
            <>
              <Field
                label="Texto"
                hint={
                  textCheck?.limit != null && (
                    <span className={textCheck.over ? "font-semibold text-amber-400" : "text-zinc-500"}>
                      {textCheck.count}/{textCheck.limit} {textCheck.over && "· acima do guia"}
                    </span>
                  )
                }
              >
                <TextArea value={el.text ?? ""} onChange={(e) => onPatchElement(el.id, { text: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Fonte">
                  <Select
                    value={el.fontRole ?? "body"}
                    onChange={(v) => onPatchElement(el.id, { fontRole: v as Element["fontRole"] })}
                    options={[
                      { value: "display", label: "Display" },
                      { value: "body", label: "Corpo" },
                      { value: "label", label: "Label/Mono" },
                    ]}
                  />
                </Field>
                <Field label="Alinhamento">
                  <Select
                    value={el.align ?? "left"}
                    onChange={(v) => onPatchElement(el.id, { align: v as Element["align"] })}
                    options={[
                      { value: "left", label: "Esquerda" },
                      { value: "center", label: "Centro" },
                      { value: "right", label: "Direita" },
                    ]}
                  />
                </Field>
                <Field label="Peso da fonte">
                  <Select
                    value={String(el.fontWeight ?? 400)}
                    onChange={(v) => onPatchElement(el.id, { fontWeight: Number(v) })}
                    options={WEIGHTS}
                  />
                </Field>
              </div>
              <SliderField label="Tamanho da fonte (px)" value={el.fontSize ?? 40} min={12} max={300} onChange={(v) => onPatchElement(el.id, { fontSize: v })} />
              <SliderField label="Entrelinha" value={el.lineHeight ?? 1.25} min={0.8} max={3} step={0.05} onChange={(v) => onPatchElement(el.id, { lineHeight: v })} />
              <SliderField label="Espaçamento entre letras (px)" value={el.letterSpacing ?? 0} min={-5} max={40} step={0.5} onChange={(v) => onPatchElement(el.id, { letterSpacing: v })} />
              <label className="mb-3 flex items-center gap-2 text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={el.uppercase ?? false}
                  onChange={(e) => onPatchElement(el.id, { uppercase: e.target.checked })}
                />
                CAIXA ALTA
              </label>
              <TokenColorField label="Cor" value={el.color} onChange={(color) => onPatchElement(el.id, { color })} />

              {/* ==realce==: cor da caixa e do texto por cima, só deste elemento */}
              {(el.text ?? "").includes("==") && (
                <div className="mb-3 rounded-lg border border-white/8 bg-white/[0.03] p-2">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-lo)]">
                    <Highlighter size={12} /> Realce deste texto
                  </div>
                  <TokenColorField label="Caixa do realce" value={el.highlightBg ?? "accent"} onChange={(v) => onPatchElement(el.id, { highlightBg: v })} />
                  <TokenColorField label="Texto sobre o realce" value={el.highlightText ?? "bg"} onChange={(v) => onPatchElement(el.id, { highlightText: v })} />
                  {(el.highlightBg || el.highlightText) && (
                    <button type="button" onClick={() => onPatchElement(el.id, { highlightBg: undefined, highlightText: undefined })} className="text-[11px] text-[var(--brand-hi)] hover:underline">
                      Voltar ao padrão do carrossel
                    </button>
                  )}
                </div>
              )}

              {(el.role === "cta-primary" || el.role === "cta-secondary") && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border border-white/8 bg-white/[0.03] p-2">
                  <Field label="Estilo do botão">
                    <Select
                      value={el.ctaVariant ?? "text"}
                      onChange={(v) => onPatchElement(el.id, { ctaVariant: v as Element["ctaVariant"] })}
                      options={[
                        { value: "text", label: "Só texto" },
                        { value: "solid", label: "Pílula sólida" },
                        { value: "soft", label: "Pílula suave" },
                        { value: "outline", label: "Contorno" },
                      ]}
                    />
                  </Field>
                  <Field label="Ícone">
                    <Select
                      value={el.ctaIcon ?? "none"}
                      onChange={(v) => onPatchElement(el.id, { ctaIcon: v as Element["ctaIcon"] })}
                      options={[
                        { value: "none", label: "Nenhum" },
                        { value: "arrow-right", label: "Seta →" },
                        { value: "arrow-down", label: "Seta ↓" },
                        { value: "chat", label: "Comentar 💬" },
                        { value: "bookmark", label: "Salvar 🔖" },
                        { value: "heart", label: "Curtir ♥" },
                        { value: "send", label: "Enviar ➤" },
                      ]}
                    />
                  </Field>
                </div>
              )}
              {(el.fontSize ?? 40) < 40 && el.role === "body" && (
                <p className="mb-2 rounded-md bg-amber-500/10 px-2 py-1.5 text-[11px] text-amber-300">
                  ⚠ Corpo abaixo de 40px fica difícil de ler no celular.
                </p>
              )}
            </>
          )}

          {el.type === "social" && (
            <>
              <SliderField label="Espaço entre ícones" value={el.gap ?? 48} min={12} max={160} onChange={(v) => onPatchElement(el.id, { gap: v })} />
              <TokenColorField label="Cor" value={el.color} onChange={(color) => onPatchElement(el.id, { color })} />
            </>
          )}

          {el.type === "image" && (
            <>
              <div className="mb-3 flex items-center gap-2">
                <FileButton label={el.src ? "Trocar imagem" : "Subir imagem"} onFile={(src) => onPatchElement(el.id, { src })} />
                {el.src && (
                  <Btn variant="danger" onClick={() => onPatchElement(el.id, { src: undefined })}>
                    <Trash2 size={13} />
                  </Btn>
                )}
              </div>
              {onGenerateImageEl && (
                <div className="mb-3 rounded-lg border border-white/8 bg-white/[0.03] p-2">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-lo)]">
                    <Sparkles size={12} /> Gerar com IA
                  </div>
                  <AiImageBox compact titulo="Gerar imagem" busy={aiBusy} onGenerate={(input) => onGenerateImageEl(el.id, input)} />
                </div>
              )}
              <Field label="Ajuste">
                <Select
                  value={el.fit ?? "cover"}
                  onChange={(v) => onPatchElement(el.id, { fit: v as Element["fit"] })}
                  options={[
                    { value: "cover", label: "Cover (preenche)" },
                    { value: "contain", label: "Contain (inteira)" },
                  ]}
                />
              </Field>
              {el.src && (
                <>
                  <SliderField label={`Zoom da imagem — ${Math.round((el.imgScale ?? 1) * 100)}%`} value={el.imgScale ?? 1} min={1} max={3} step={0.02} onChange={(v) => onPatchElement(el.id, { imgScale: v })} />
                  <div className="grid grid-cols-2 gap-2">
                    <SliderField label="Mover ⇆" value={el.imgPosX ?? 0} min={-50} max={50} onChange={(v) => onPatchElement(el.id, { imgPosX: v })} />
                    <SliderField label="Mover ⇅" value={el.imgPosY ?? 0} min={-50} max={50} onChange={(v) => onPatchElement(el.id, { imgPosY: v })} />
                  </div>
                </>
              )}
              <SliderField label="Raio de canto" value={el.radius ?? 0} min={0} max={200} onChange={(v) => onPatchElement(el.id, { radius: v })} />
              <label className="mb-3 flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={el.shadow ?? false} onChange={(e) => onPatchElement(el.id, { shadow: e.target.checked })} />
                Sombra
              </label>
            </>
          )}

          {el.type === "shape" && (
            <>
              <Field label="Tipo">
                <Select
                  value={el.shape ?? "rect"}
                  onChange={(v) => onPatchElement(el.id, { shape: v as Element["shape"] })}
                  options={[
                    { value: "rect", label: "Retângulo" },
                    { value: "line", label: "Linha" },
                  ]}
                />
              </Field>
              <SliderField label="Raio de canto" value={el.radius2 ?? 0} min={0} max={200} onChange={(v) => onPatchElement(el.id, { radius2: v })} />
              <TokenColorField label="Preenchimento" value={el.fill} onChange={(fill) => onPatchElement(el.id, { fill })} />
            </>
          )}

          <SliderField label="Opacidade (%)" value={el.opacity ?? 100} min={0} max={100} onChange={(v) => onPatchElement(el.id, { opacity: v })} />

          <div className="mb-1 mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Posição & Tamanho</div>
          <SliderField label="Posição X" value={el.x} min={-200} max={CANVAS_W} onChange={(v) => onPatchElement(el.id, { x: v })} />
          <SliderField label="Posição Y" value={el.y} min={-200} max={CANVAS_H} onChange={(v) => onPatchElement(el.id, { y: v })} />
          <SliderField label="Largura" value={el.w} min={20} max={CANVAS_W} onChange={(v) => onPatchElement(el.id, { w: v })} />
          <SliderField label="Altura" value={el.h} min={20} max={CANVAS_H} onChange={(v) => onPatchElement(el.id, { h: v })} />

          <Field label="Camada">
            <div className="flex gap-1">
              <Btn title="Trazer pra frente" onClick={() => moveZ("front")}>
                <ChevronsUp size={13} />
              </Btn>
              <Btn title="Subir" onClick={() => moveZ("up")}>
                <ArrowUp size={13} />
              </Btn>
              <Btn title="Descer" onClick={() => moveZ("down")}>
                <ArrowDown size={13} />
              </Btn>
              <Btn title="Mandar pro fundo" onClick={() => moveZ("back")}>
                <ChevronsDown size={13} />
              </Btn>
              <span className="ml-2 self-center text-xs text-zinc-500">z = {el.z}</span>
            </div>
          </Field>

          <SliderField label="Rotação (graus)" value={el.rotation ?? 0} min={-180} max={180} onChange={(v) => onPatchElement(el.id, { rotation: v })} />
        </Section>
      )}
    </>
  );
}
