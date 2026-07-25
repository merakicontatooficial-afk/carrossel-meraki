import { useState } from "react";
import type { BrandKit } from "../../types";
import { AVAILABLE_FONTS } from "../../lib/resolve";
import { extractPalette, type PaletteSuggestion } from "../../lib/palette";
import { Btn, ColorInput, Field, FileButton, Section, Select, inputCls } from "../ui";
import { Palette } from "lucide-react";

interface Props {
  kit: BrandKit;
  onUpdateKit: (kit: BrandKit) => void; // edita o kit próprio do carrossel
  onCreateKit?: (kit: BrandKit) => void; // mantido por compatibilidade (não usado)
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${color}`}>
      <span className="h-5 w-5 rounded-md border border-white/15" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-zinc-500">{label}</span>
    </div>
  );
}

export default function IdentityPanel({ kit, onUpdateKit }: Props) {
  const [suggestion, setSuggestion] = useState<PaletteSuggestion | null>(null);

  const applyPalette = () => {
    if (!suggestion) return;
    onUpdateKit({
      ...kit,
      bg: suggestion.bg,
      text: suggestion.text,
      accent: suggestion.accent,
      surface: suggestion.bg,
    });
    setSuggestion(null);
  };

  const fontOptions = AVAILABLE_FONTS.map((f) => ({ value: f, label: f }));

  return (
    <Section title="Cores & Tipografia" icon={<Palette size={15} />}>
      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1.5">
        <Swatch color={kit.bg} label="fundo" />
        <Swatch color={kit.text} label="texto" />
        <Swatch color={kit.accent} label="acento" />
        <Swatch color={kit.muted} label="suave" />
        {kit.glow && <Swatch color={kit.glow} label="brilho" />}
      </div>

      <div className="space-y-1">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fundo">
            <ColorInput value={kit.bg} onChange={(bg) => onUpdateKit({ ...kit, bg })} />
          </Field>
          <Field label="Texto">
            <ColorInput value={kit.text} onChange={(text) => onUpdateKit({ ...kit, text })} />
          </Field>
          <Field label="Acento">
            <ColorInput value={kit.accent} onChange={(accent) => onUpdateKit({ ...kit, accent })} />
          </Field>
          <Field label="Suave">
            <ColorInput value={kit.muted} onChange={(muted) => onUpdateKit({ ...kit, muted })} />
          </Field>
        </div>
        <Field label="Acento 2 — gradiente no *destaque* (vazio = cor sólida)">
          <ColorInput value={kit.accent2 ?? ""} onChange={(v) => onUpdateKit({ ...kit, accent2: v || null })} />
        </Field>
        <Field label="Brilho (vazio = sem brilho)">
          <ColorInput value={kit.glow ?? ""} onChange={(glow) => onUpdateKit({ ...kit, glow: glow || null, motif: glow ? "glow" : "minimal" })} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Fonte display">
            <Select value={kit.fontDisplay} onChange={(fontDisplay) => onUpdateKit({ ...kit, fontDisplay })} options={fontOptions} />
          </Field>
          <Field label="Fonte corpo">
            <Select value={kit.fontBody} onChange={(fontBody) => onUpdateKit({ ...kit, fontBody })} options={fontOptions} />
          </Field>
          <Field label="Fonte label">
            <Select value={kit.fontLabel} onChange={(fontLabel) => onUpdateKit({ ...kit, fontLabel })} options={fontOptions} />
          </Field>
          <Field label="Eyebrow / @handle">
            <Select
              value={kit.eyebrow}
              onChange={(v) => onUpdateKit({ ...kit, eyebrow: v as BrandKit["eyebrow"] })}
              options={[
                { value: "handle", label: "Pílula @handle (viral)" },
                { value: "pill-index", label: "Pílula com índice" },
                { value: "badge", label: "Badge preenchido" },
                { value: "minimal", label: "Minimal" },
              ]}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="@handle / logo (texto)">
            <input className={inputCls} value={kit.logo} onChange={(e) => onUpdateKit({ ...kit, logo: e.target.value })} />
          </Field>
          <Field label="Sub (opcional)">
            <input className={inputCls} value={kit.sub ?? ""} onChange={(e) => onUpdateKit({ ...kit, sub: e.target.value || undefined })} />
          </Field>
        </div>
      </div>

      <div className="mt-4 border-t border-white/8 pt-3">
        <FileButton
          label={
            <>
              <Palette size={13} /> Paleta a partir de imagem
            </>
          }
          onFile={async (dataUrl) => setSuggestion(await extractPalette(dataUrl))}
        />
        {suggestion && (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex gap-1">
              {suggestion.palette.map((c) => (
                <span key={c} className="h-6 flex-1 rounded" style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
            <div className="mb-3 flex gap-3">
              <Swatch color={suggestion.bg} label="fundo" />
              <Swatch color={suggestion.text} label="texto" />
              <Swatch color={suggestion.accent} label="acento" />
            </div>
            <div className="flex gap-2">
              <Btn variant="primary" onClick={applyPalette}>
                Aplicar essa paleta
              </Btn>
              <Btn onClick={() => setSuggestion(null)}>Descartar</Btn>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
