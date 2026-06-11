import type { CarouselCounter, CounterPos, CounterStyle } from "../../types";
import { Field, Section, Select } from "../ui";

interface Props {
  counter: CarouselCounter | undefined;
  onChange: (counter: CarouselCounter | undefined) => void;
}

const DEFAULT: CarouselCounter = { style: "dots", pos: "bc", accent: true, hideOnCover: false };

export default function CounterPanel({ counter, onChange }: Props) {
  const c = { ...DEFAULT, ...counter };
  const set = (patch: Partial<CarouselCounter>) => {
    const next = { ...c, ...patch };
    onChange(next.style === "none" ? undefined : next);
  };

  return (
    <Section title="Contador de slides">
      <Field label="Estilo">
        <Select
          value={counter?.style ?? "none"}
          onChange={(v) => set({ style: v as CounterStyle })}
          options={[
            { value: "none", label: "Nenhum" },
            { value: "dots", label: "Bolinhas ● ● ●" },
            { value: "bars", label: "Barras ▬▬▬" },
            { value: "fraction", label: "Fração 01 / 07" },
            { value: "number", label: "Número grande 03" },
          ]}
        />
      </Field>
      {counter && counter.style !== "none" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Posição">
              <Select
                value={c.pos}
                onChange={(v) => set({ pos: v as CounterPos })}
                options={[
                  { value: "bc", label: "Embaixo · centro" },
                  { value: "br", label: "Embaixo · direita" },
                  { value: "bl", label: "Embaixo · esquerda" },
                  { value: "tc", label: "Topo · centro" },
                  { value: "tr", label: "Topo · direita" },
                ]}
              />
            </Field>
            <Field label="Cor">
              <Select
                value={c.accent ? "accent" : "text"}
                onChange={(v) => set({ accent: v === "accent" })}
                options={[
                  { value: "accent", label: "Acento" },
                  { value: "text", label: "Texto" },
                ]}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={c.hideOnCover ?? false} onChange={(e) => set({ hideOnCover: e.target.checked })} />
            Esconder na capa (slide 1)
          </label>
        </>
      )}
    </Section>
  );
}
