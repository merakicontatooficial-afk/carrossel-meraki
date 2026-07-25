import { useState } from "react";
import type { Collection, Template } from "../../types";
import { api } from "../../lib/api";
import { FolderPlus, Trash2, TrendingUp, Settings, LayoutTemplate, Copy, Search, Loader2, Sparkles, ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function Placeholder({ icon, title, note }: { icon: ReactNode; title: string; note: string }) {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="glass flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-[var(--brand-hi)]">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="max-w-sm text-sm text-white/50">{note}</p>
      </div>
    </div>
  );
}

type TrendItem = { titulo: string; fonte: string; quando: string; resumo: string };

export function TrendingsView({ onCreateFromTrend }: { onCreateFromTrend: (tema: string) => void }) {
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState("semana");
  const [items, setItems] = useState<TrendItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = async () => {
    if (!q.trim()) return;
    setBusy(true);
    setErro(null);
    try {
      setItems(await api.trends(q, period, 8));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[var(--brand-hi)]"><TrendingUp size={22} /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Trendings</h1>
          <p className="text-sm text-[var(--text-md)]">Notícia em alta → carrossel num clique. A busca é ancorada em fontes reais (Google Search).</p>
        </div>
      </div>

      <div className="glass mb-6 flex flex-wrap items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
          <Search size={16} className="text-[var(--text-lo)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Ex.: marketing para restaurantes, IA no varejo, delivery…"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-white outline-none"
          />
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none">
          <option value="dia" className="bg-zinc-900">Últimas 24h</option>
          <option value="semana" className="bg-zinc-900">Última semana</option>
          <option value="mes" className="bg-zinc-900">Último mês</option>
        </select>
        <button className="btn btn-primary" onClick={buscar} disabled={busy || !q.trim()}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Buscar
        </button>
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}

      {items === null ? (
        <p className="py-16 text-center text-sm text-white/45">Busque um tema pra ver o que está em alta agora.</p>
      ) : items.length === 0 ? (
        <p className="py-16 text-center text-sm text-white/45">Nada encontrado pra esse tema/período.</p>
      ) : (
        <div className="space-y-3">
          {items.map((t, i) => (
            <div key={i} className="glass flex items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-white">{t.titulo}</div>
                {t.resumo && <p className="mt-1 text-xs leading-relaxed text-[var(--text-md)]">{t.resumo}</p>}
                <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-lo)]">
                  {t.fonte && <span>{t.fonte}</span>}
                  {t.quando && <span>· {t.quando}</span>}
                </div>
              </div>
              <button className="btn btn-primary shrink-0 !min-h-0 !py-2" onClick={() => onCreateFromTrend(t.titulo)} title="Gerar carrossel deste tema">
                <Sparkles size={14} /> Criar <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConfigView() {
  return <Placeholder icon={<Settings size={22} />} title="Configurações" note="Perfil da marca, treino de voz por cliente e consumo de IA entram aqui na próxima etapa." />;
}

export function TemplatesView({ templates, onClone, onDelete }: { templates: Template[]; onClone: (id: string) => void; onDelete: (id: string) => void }) {
  if (templates.length === 0) {
    return <Placeholder icon={<LayoutTemplate size={22} />} title="Templates" note="Você ainda não salvou nenhum template. No editor, salve um carrossel como template pra reutilizar o design." />;
  }
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <h1 className="mb-6 text-xl font-bold text-white">Templates</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <div key={t.id} className="glass flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-white/45">{t.slides.length} slides</div>
            </div>
            <button className="btn !min-h-0 !px-3 !py-2" onClick={() => onClone(t.id)} title="Clonar"><Copy size={14} /></button>
            <button className="btn btn-danger !min-h-0 !px-3 !py-2" onClick={() => onDelete(t.id)} title="Excluir"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OrganizacaoView({
  collections, counts, onCreate, onDelete,
}: {
  collections: Collection[];
  counts: Record<string, number>;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="mr-auto text-xl font-bold text-white">Organização</h1>
        <button className="btn btn-primary" onClick={onCreate}><FolderPlus size={15} /> Novo cliente</button>
      </div>
      <p className="mb-6 text-sm text-white/50">Cada cliente é uma coleção. Ao gerar um carrossel, escolha o cliente para a IA escrever na voz dele.</p>
      {collections.length === 0 ? (
        <div className="glass py-16 text-center text-sm text-white/45">Nenhum cliente ainda. Crie o primeiro.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <div key={c.id} className="glass flex items-center gap-3 p-4">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{c.name}</div>
                <div className="text-xs text-white/45">{counts[c.id] ?? 0} carrosséis</div>
              </div>
              <button className="btn btn-danger !min-h-0 !px-3 !py-2" onClick={() => onDelete(c.id)} title="Excluir"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
