import type { CarouselFrame } from "../../types";
import { Btn, Field, FileButton, Section } from "../ui";
import { Trash2 } from "lucide-react";

interface Props {
  frame: CarouselFrame | undefined;
  onChange: (frame: CarouselFrame | undefined) => void;
}

const EMPTY: CarouselFrame = { top: null, bottom: null, topScale: 100, bottomScale: 100, topOffset: 0, bottomOffset: 0 };

/**
 * PNGs decorativos sobrepostos POR CIMA de todos os slides (topo e base).
 * Aspecto natural — não cortam o conteúdo; ajustáveis em largura e posição.
 */
export default function FramePanel({ frame, onChange }: Props) {
  const f = { ...EMPTY, ...frame };
  const set = (patch: Partial<CarouselFrame>) => {
    const next = { ...f, ...patch };
    onChange(next.top || next.bottom ? next : undefined);
  };

  return (
    <Section title="PNG sobreposto (topo/base)">
      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {f.top && <img src={f.top} alt="" className="h-7 w-14 rounded bg-white/5 object-contain p-0.5" />}
            <FileButton label={f.top ? "Trocar PNG do topo" : "PNG do topo"} onFile={(top) => set({ top })} />
            {f.top && (
              <Btn variant="danger" title="Remover topo" onClick={() => set({ top: null })}>
                <Trash2 size={13} />
              </Btn>
            )}
          </div>
          {f.top && (
            <div className="grid grid-cols-2 gap-2">
              <Field label={`Largura — ${f.topScale}%`}>
                <input type="range" min={20} max={130} value={f.topScale} onChange={(e) => set({ topScale: Number(e.target.value) })} className="w-full" />
              </Field>
              <Field label={`Posição — ${f.topOffset}px`}>
                <input type="range" min={-200} max={300} value={f.topOffset} onChange={(e) => set({ topOffset: Number(e.target.value) })} className="w-full" />
              </Field>
            </div>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-2">
            {f.bottom && <img src={f.bottom} alt="" className="h-7 w-14 rounded bg-white/5 object-contain p-0.5" />}
            <FileButton label={f.bottom ? "Trocar PNG da base" : "PNG da base"} onFile={(bottom) => set({ bottom })} />
            {f.bottom && (
              <Btn variant="danger" title="Remover base" onClick={() => set({ bottom: null })}>
                <Trash2 size={13} />
              </Btn>
            )}
          </div>
          {f.bottom && (
            <div className="grid grid-cols-2 gap-2">
              <Field label={`Largura — ${f.bottomScale}%`}>
                <input type="range" min={20} max={130} value={f.bottomScale} onChange={(e) => set({ bottomScale: Number(e.target.value) })} className="w-full" />
              </Field>
              <Field label={`Posição — ${f.bottomOffset}px`}>
                <input type="range" min={-200} max={300} value={f.bottomOffset} onChange={(e) => set({ bottomOffset: Number(e.target.value) })} className="w-full" />
              </Field>
            </div>
          )}
        </div>

        {!f.top && !f.bottom && (
          <p className="text-[11px] leading-relaxed text-zinc-500">
            Suba PNGs (com fundo transparente) pra sobrepor uma moldura de marca por cima de todos os slides. Mantém o aspecto original — ajuste largura e posição.
          </p>
        )}
      </div>
    </Section>
  );
}
