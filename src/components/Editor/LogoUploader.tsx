import type { CarouselLogo, LogoPosition } from "../../types";
import { Btn, FileButton, Section } from "../ui";
import { Trash2 } from "lucide-react";

const POSITIONS: { value: LogoPosition; label: string }[] = [
  { value: "tl", label: "↖" },
  { value: "tr", label: "↗" },
  { value: "bl", label: "↙" },
  { value: "br", label: "↘" },
];

interface Props {
  logo: CarouselLogo;
  onChange: (logo: CarouselLogo) => void;
}

/** Logo manual do carrossel: upload, mostrar/ocultar, posição no canto. */
export default function LogoUploader({ logo, onChange }: Props) {
  return (
    <Section title="Logo manual">
      <div className="flex items-center gap-2">
        {logo.src && (
          <img src={logo.src} alt="logo" className="h-9 max-w-[72px] rounded bg-white/5 object-contain p-1" />
        )}
        <FileButton label={logo.src ? "Trocar logo" : "Subir logo (PNG)"} onFile={(src) => onChange({ ...logo, src, show: true })} />
        {logo.src && (
          <Btn variant="danger" title="Remover" onClick={() => onChange({ ...logo, src: null })}>
            <Trash2 size={13} />
          </Btn>
        )}
      </div>
      {logo.src && (
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input type="checkbox" checked={logo.show} onChange={(e) => onChange({ ...logo, show: e.target.checked })} />
            Mostrar
          </label>
          <div className="flex gap-1">
            {POSITIONS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ ...logo, position: p.value })}
                className={`h-8 w-8 rounded-lg border text-sm ${
                  logo.position === p.value
                    ? "border-violet-500 bg-violet-500/20 text-violet-200"
                    : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!logo.src && (
        <p className="mt-2 text-[11px] text-zinc-500">Sem logo manual, o rodapé usa o logo de texto do kit.</p>
      )}
    </Section>
  );
}
