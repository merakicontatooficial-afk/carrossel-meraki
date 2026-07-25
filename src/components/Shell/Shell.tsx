import type { ReactNode } from "react";
import Sidebar, { type View } from "./Sidebar";
import { Search, Sparkles, Plus } from "lucide-react";

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  onGerarIA: () => void;
  onCriar: () => void;
  search: string;
  onSearch: (s: string) => void;
  children: ReactNode;
}

export default function Shell({ view, onNavigate, onGerarIA, onCriar, search, onSearch, children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar view={view} onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-4 border-b border-white/10 px-8 py-4">
          <div className="relative w-full max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-lo)]" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Buscar carrosséis, templates, clientes…"
              className="glass w-full !rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[var(--text-lo)] outline-none focus:border-[var(--glass-brd-h)]"
            />
          </div>
          <button className="btn ml-auto" onClick={onCriar}>
            <Plus size={15} /> Criar
          </button>
          <button className="btn btn-primary" onClick={onGerarIA}>
            <Sparkles size={15} /> Gerar com IA
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
