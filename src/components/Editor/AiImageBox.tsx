import { useState } from "react";
import { FileButton } from "../ui";
import { ImageIcon, Loader2, Plus, Sparkles, X } from "lucide-react";

export const MAX_REFS = 3;

export interface AiImageInput {
  prompt: string;
  refs: { data: string; mime: string }[];
}

/** dataURL → { data (base64 puro), mime } para mandar ao backend. */
export function splitDataUrl(dataUrl: string): { data: string; mime: string } {
  const [head, b64] = dataUrl.split(",");
  return { data: b64 ?? "", mime: /data:(.*?);/.exec(head)?.[1] || "image/jpeg" };
}

/**
 * Caixa de geração de imagem por IA: descrição + até 3 imagens de referência
 * (rosto, produto, estilo). Usada tanto no fundo do slide quanto em cada cartão.
 */
export default function AiImageBox({
  titulo = "Gerar imagem com IA",
  placeholder = "Descreva a imagem (vazio = usa o título do slide)",
  busy,
  onGenerate,
  compact = false,
}: {
  titulo?: string;
  placeholder?: string;
  busy?: boolean;
  onGenerate: (input: AiImageInput) => void;
  compact?: boolean;
}) {
  const [prompt, setPrompt] = useState("");
  const [refs, setRefs] = useState<string[]>([]); // dataURLs

  const addRef = (dataUrl: string) => setRefs((r) => (r.length >= MAX_REFS ? r : [...r, dataUrl]));
  const delRef = (i: number) => setRefs((r) => r.filter((_, j) => j !== i));

  return (
    <div className={compact ? "" : "mb-3"}>
      <div className="mb-1.5 text-xs text-[var(--text-md)]">Descrição da imagem</div>
      <textarea
        rows={compact ? 2 : 3}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={placeholder}
        className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-snug text-white outline-none focus:border-[var(--glass-brd-h)]"
      />

      <div className="mb-1.5 mt-2 flex items-center justify-between text-xs text-[var(--text-md)]">
        <span>Referências (rosto, produto, estilo)</span>
        <span className="text-[11px] text-[var(--text-lo)]">{refs.length}/{MAX_REFS}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {refs.map((r, i) => (
          <div key={i} className="relative">
            <img src={r} alt={`referência ${i + 1}`} className="h-12 w-12 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => delRef(i)}
              title="Remover referência"
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-[var(--text-md)] hover:text-white"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {refs.length < MAX_REFS && (
          <FileButton
            label={
              <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-white/20 text-[var(--text-lo)] hover:border-white/40 hover:text-white">
                <Plus size={16} />
              </span>
            }
            className="cursor-pointer"
            onFile={addRef}
          />
        )}
      </div>

      <button
        type="button"
        className="btn btn-primary mt-3 w-full !py-2 text-xs"
        disabled={busy}
        onClick={() => onGenerate({ prompt: prompt.trim(), refs: refs.map(splitDataUrl) })}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : refs.length ? <Sparkles size={13} /> : <ImageIcon size={13} />}
        {titulo}
      </button>
    </div>
  );
}
