import type { Collection } from "../../types";
import { Copy, FolderPlus, Trash2 } from "lucide-react";

export const COLLECTION_COLORS = ["#8B5CF6", "#C9A84C", "#5B8DEF", "#E8A39C", "#34D399", "#F472B6", "#F59E0B"];

interface Props {
  collections: Collection[];
  filter: string | null; // null = todas
  counts: Record<string, number>;
  total: number;
  onFilter: (id: string | null) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Collections({ collections, filter, counts, total, onFilter, onCreate, onDuplicate, onDelete }: Props) {
  return (
    <aside className="w-56 shrink-0">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Coleções</h2>
        <button type="button" title="Nova coleção" onClick={onCreate} className="rounded-md p-1 text-zinc-400 hover:bg-white/10">
          <FolderPlus size={14} />
        </button>
      </div>
      <ul className="space-y-0.5">
        <li>
          <button
            type="button"
            onClick={() => onFilter(null)}
            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm ${
              filter === null ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:bg-white/5"
            }`}
          >
            <span>Todos</span>
            <span className="text-[11px] tabular-nums text-zinc-500">{total}</span>
          </button>
        </li>
        {collections.map((c) => (
          <li key={c.id} className="group">
            <div
              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                filter === c.id ? "bg-white/10 text-zinc-100" : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              <button type="button" onClick={() => onFilter(c.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="truncate">{c.name}</span>
              </button>
              <span className="text-[11px] tabular-nums text-zinc-500">{counts[c.id] ?? 0}</span>
              <button
                type="button"
                title="Duplicar coleção inteira"
                onClick={() => onDuplicate(c.id)}
                className="hidden rounded p-0.5 text-zinc-500 hover:bg-white/10 group-hover:block"
              >
                <Copy size={12} />
              </button>
              <button
                type="button"
                title="Excluir coleção"
                onClick={() => confirm(`Excluir a coleção "${c.name}"? Os carrosséis continuam na biblioteca.`) && onDelete(c.id)}
                className="hidden rounded p-0.5 text-red-400/70 hover:bg-red-500/15 group-hover:block"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
