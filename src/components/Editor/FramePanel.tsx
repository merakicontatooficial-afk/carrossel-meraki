import type { CarouselFrame } from "../../types";
import { Btn, Field, FileButton, Section } from "../ui";
import { Trash2 } from "lucide-react";

interface Props {
  frame: CarouselFrame | undefined;
  onChange: (frame: CarouselFrame | undefined) => void;
}

const EMPTY: CarouselFrame = { top: null, bottom: null, topH: 150, bottomH: 150 };

/**
 * Faixas PNG decorativas fixas no topo e na base de TODOS os slides
 * (molduras de marca que muitas empresas trocam por campanha).
 */
export default function FramePanel({ frame, onChange }: Props) {
  const f = frame ?? EMPTY;
  const set = (patch: Partial<CarouselFrame>) => {
    const next = { ...f, ...patch };
    onChange(next.top || next.bottom ? next : undefined);
  };

  return (
    <Section title="Moldura (PNG topo/base)">
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {f.top && <img src={f.top} alt="" className="h-7 w-14 rounded bg-white/5 object-contain p-0.5" />}
            <FileButton label={f.top ? "Trocar faixa do topo" : "Faixa do topo"} onFile={(top) => set({ top })} />
            {f.top && (
              <Btn variant="danger" title="Remover topo" onClick={() => set({ top: null })}>
                <Trash2 size={13} />
              </Btn>
            )}
          </div>
          {f.top && (
            <Field label={`Altura do topo — ${f.topH}px`}>
              <input type="range" min={40} max={400} value={f.topH} onChange={(e) => set({ topH: Number(e.target.value) })} className="w-full" />
            </Field>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {f.bottom && <img src={f.bottom} alt="" className="h-7 w-14 rounded bg-white/5 object-contain p-0.5" />}
            <FileButton label={f.bottom ? "Trocar faixa da base" : "Faixa da base"} onFile={(bottom) => set({ bottom })} />
            {f.bottom && (
              <Btn variant="danger" title="Remover base" onClick={() => set({ bottom: null })}>
                <Trash2 size={13} />
              </Btn>
            )}
          </div>
          {f.bottom && (
            <Field label={`Altura da base — ${f.bottomH}px`}>
              <input type="range" min={40} max={400} value={f.bottomH} onChange={(e) => set({ bottomH: Number(e.target.value) })} className="w-full" />
            </Field>
          )}
        </div>

        {!f.top && !f.bottom && (
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Suba PNGs (de preferência com fundo transparente) pra repetir uma moldura de marca no topo e na base de todos os slides.
          </p>
        )}
      </div>
    </Section>
  );
}
