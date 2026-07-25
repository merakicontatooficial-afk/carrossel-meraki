import { useEffect, useState } from "react";
import type { Collection, Template } from "../../types";
import { api, type TrendItem, type AcessoUser } from "../../lib/api";
import { FolderPlus, Trash2, TrendingUp, Settings, LayoutTemplate, Copy, Search, Loader2, Sparkles, ArrowRight, Flame, RefreshCw, Users, ShieldCheck } from "lucide-react";
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

function TrendRow({ t, onCreate }: { t: TrendItem; onCreate: () => void }) {
  return (
    <div className="glass flex items-start gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {t.categoria && <span className="rounded-full bg-[var(--brand-sat)]/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--brand-hi)]">{t.categoria}</span>}
          <span className="text-sm font-semibold text-white">{t.titulo}</span>
        </div>
        {t.resumo && <p className="mt-1 text-xs leading-relaxed text-[var(--text-md)]">{t.resumo}</p>}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--text-lo)]">
          {t.fonte && <span>{t.fonte}</span>}
          {t.quando && <span>· {t.quando}</span>}
        </div>
      </div>
      <button className="btn btn-primary shrink-0 !min-h-0 !py-2" onClick={onCreate} title="Gerar carrossel deste tema">
        <Sparkles size={14} /> Criar <ArrowRight size={13} />
      </button>
    </div>
  );
}

export function TrendingsView({ onCreateFromTrend }: { onCreateFromTrend: (tema: string) => void }) {
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState("semana");
  const [results, setResults] = useState<TrendItem[] | null>(null); // resultado de busca (sobrepõe o diário)
  const [daily, setDaily] = useState<TrendItem[] | null>(null);
  const [dailyDate, setDailyDate] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // "em alta hoje" carrega sozinho ao abrir (cache/dia no servidor)
  useEffect(() => {
    (async () => {
      try {
        const { date, items } = await api.dailyTrends();
        setDaily(items);
        setDailyDate(date);
      } catch (e) {
        setErro((e as Error).message);
      } finally {
        setLoadingDaily(false);
      }
    })();
  }, []);

  const buscar = async () => {
    if (!q.trim()) return;
    setBusy(true);
    setErro(null);
    try {
      setResults(await api.trends(q, period, 8));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const limparBusca = () => { setResults(null); setQ(""); };

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[var(--brand-hi)]"><TrendingUp size={22} /></div>
        <div>
          <h1 className="text-xl font-bold text-white">Trendings</h1>
          <p className="text-sm text-[var(--text-md)]">O que está em alta no Brasil, atualizado todo dia — ou pesquise um tema. Tudo ancorado em fontes reais.</p>
        </div>
      </div>

      <div className="glass mb-6 flex flex-wrap items-center gap-2 p-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3">
          <Search size={16} className="text-[var(--text-lo)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscar()}
            placeholder="Pesquisar um tema específico…"
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

      {results !== null ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Resultados da busca</h2>
            <button className="text-[12px] text-[var(--brand-hi)] hover:underline" onClick={limparBusca}>← Voltar ao "em alta hoje"</button>
          </div>
          {results.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/45">Nada encontrado pra esse tema/período.</p>
          ) : (
            <div className="space-y-3">{results.map((t, i) => <TrendRow key={i} t={t} onCreate={() => onCreateFromTrend(t.titulo)} />)}</div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Flame size={16} className="text-amber-400" />
            <h2 className="mr-auto text-sm font-semibold text-white">Em alta hoje {dailyDate && <span className="text-[var(--text-lo)]">· {dailyDate.split("-").reverse().join("/")}</span>}</h2>
          </div>
          {loadingDaily ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-md)]"><Loader2 size={16} className="animate-spin" /> Buscando o que está bombando…</div>
          ) : !daily || daily.length === 0 ? (
            <p className="py-12 text-center text-sm text-white/45">Não consegui carregar o trending de hoje. Tente uma busca.</p>
          ) : (
            <div className="space-y-3">{daily.map((t, i) => <TrendRow key={i} t={t} onCreate={() => onCreateFromTrend(t.titulo)} />)}</div>
          )}
        </>
      )}
    </div>
  );
}

export function ConfigView({ isAdmin }: { isAdmin: boolean }) {
  const [users, setUsers] = useState<AcessoUser[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(isAdmin);

  const carregar = async () => {
    setLoading(true);
    setErro(null);
    try {
      const { users } = await api.listUsers();
      setUsers(users);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (isAdmin) carregar(); }, [isAdmin]);

  if (!isAdmin) {
    return <Placeholder icon={<Settings size={22} />} title="Configurações" note="A gestão de acessos é restrita a administradores. Contas e senhas são as mesmas do Meraki Publisher." />;
  }

  return (
    <div className="mx-auto max-w-3xl px-8 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-[var(--brand-hi)]"><Users size={22} /></div>
        <div className="mr-auto">
          <h1 className="text-xl font-bold text-white">Acessos</h1>
          <p className="text-sm text-[var(--text-md)]">Quem tem acesso à plataforma (contas compartilhadas com o Meraki Publisher).</p>
        </div>
        <button className="btn !min-h-0 !py-2" onClick={carregar} disabled={loading}><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Atualizar</button>
      </div>

      {erro && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{erro}</p>}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--text-md)]"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : (
        <div className="glass overflow-hidden">
          {(users ?? []).map((u, i) => (
            <div key={u.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-white/8" : ""}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-sat)]/25 text-[13px] font-semibold text-[var(--brand-hi)]">
                {u.nome?.slice(0, 1).toUpperCase() || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-white">{u.nome}</span>
                  {u.dono ? <ShieldCheck size={13} className="text-[var(--brand-hi)]" /> : null}
                </div>
                <div className="truncate text-[12px] text-[var(--text-lo)]">{u.email}</div>
              </div>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-[var(--text-md)]">{u.papel === "admin" ? "Admin" : "Colaborador"}</span>
              <span className={`rounded-full px-2.5 py-1 text-[11px] ${u.ativo ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-[var(--text-lo)]"}`}>{u.ativo ? "Ativo" : "Inativo"}</span>
            </div>
          ))}
          {(users ?? []).length === 0 && <p className="px-4 py-8 text-center text-sm text-white/45">Nenhum usuário encontrado.</p>}
        </div>
      )}
      <p className="mt-4 text-[12px] text-[var(--text-lo)]">Para criar, editar ou desativar contas, use o Meraki Publisher — as contas são as mesmas nas duas plataformas.</p>
    </div>
  );
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
