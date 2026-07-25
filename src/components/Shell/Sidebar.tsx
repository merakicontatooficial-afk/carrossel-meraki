import MerakiMark from "./MerakiMark";
import { LayoutDashboard, Sparkles, LayoutTemplate, TrendingUp, FolderOpen, Settings } from "lucide-react";
import type { ReactNode } from "react";

export type View = "dashboard" | "estudio" | "templates" | "trendings" | "organizacao" | "config";

const NAV: { id: View; label: string; icon: ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { id: "estudio", label: "Estúdio", icon: <Sparkles size={18} /> },
  { id: "templates", label: "Templates", icon: <LayoutTemplate size={18} /> },
  { id: "trendings", label: "Trendings", icon: <TrendingUp size={18} /> },
  { id: "organizacao", label: "Organização", icon: <FolderOpen size={18} /> },
];

export default function Sidebar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  const Item = ({ id, label, icon }: { id: View; label: string; icon: ReactNode }) => {
    const active = view === id;
    return (
      <button
        onClick={() => onNavigate(id)}
        className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition ${
          active
            ? "bg-[var(--brand-sat)] font-semibold text-white"
            : "text-[var(--text-md)] hover:bg-white/5 hover:text-white"
        }`}
      >
        {icon}
        {label}
      </button>
    );
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-white/10 px-3 py-5">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <MerakiMark size={24} />
        <div className="leading-none">
          <div className="text-[15px] font-bold tracking-tight text-white">meraki</div>
          <div className="text-[8px] font-medium tracking-[0.25em] text-white/45">CARROSSÉIS</div>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">Menu</div>
        {NAV.map((n) => (
          <Item key={n.id} {...n} />
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => onNavigate("config")}
          className={`flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm transition ${
            view === "config" ? "bg-[var(--brand-sat)] font-semibold text-white" : "text-[var(--text-md)] hover:bg-white/5 hover:text-white"
          }`}
        >
          <Settings size={18} /> Configurações
        </button>
      </div>
    </aside>
  );
}
