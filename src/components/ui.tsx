import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** Seção colapsável estilo MyPostFlow: linha com ícone + título + seta; abre/fecha. */
export function Section({
  title,
  right,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  right?: ReactNode;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-white/8">
      <div className="flex cursor-pointer items-center gap-2.5 px-4 py-3.5 hover:bg-white/[0.03]" onClick={() => setOpen((o) => !o)}>
        {icon && <span className="text-[var(--brand-hi)]">{icon}</span>}
        <span className="mr-auto text-[13px] font-medium text-white">{title}</span>
        {right && <span onClick={(e) => e.stopPropagation()}>{right}</span>}
        <ChevronDown size={16} className={`text-[var(--text-lo)] transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-md)]">
        <span>{label}</span>
        {hint}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]";

/** Slider + campo numérico lado a lado — controla a mesma propriedade. */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  hint?: ReactNode;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <label className="mb-3 block">
      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
        <span>{label}</span>
        {hint}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1"
          style={{ accentColor: "var(--brand-sat, #5103c1)" }}
        />
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          className="w-16 shrink-0 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-right text-xs tabular-nums text-zinc-100 outline-none focus:border-[var(--glass-brd-h)]"
        />
      </div>
    </label>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={2} {...props} className={`${inputCls} resize-y leading-snug ${props.className ?? ""}`} />;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      className={inputCls}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (!Number.isNaN(v)) onChange(v);
      }}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-900">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#888888";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safe}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-9 cursor-pointer rounded border border-white/10 bg-transparent p-0.5"
      />
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
    </div>
  );
}

export function FileButton({
  label,
  onFile,
  accept = "image/*",
  className,
}: {
  label: ReactNode;
  onFile: (dataUrl: string) => void;
  accept?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <>
      <label
        htmlFor={id}
        className={
          className ??
          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
        }
      >
        {label}
      </label>
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => onFile(reader.result as string);
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </>
  );
}

export function Btn({
  children,
  onClick,
  variant = "ghost",
  disabled,
  title,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 text-white"
      : variant === "danger"
        ? "bg-white/5 hover:bg-red-500/20 text-red-300 border border-white/10"
        : "bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10";
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 ${styles} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
