import { useState } from "react";
import { api, type Usuario } from "../../lib/api";
import MerakiWordmark from "../Shell/MerakiWordmark";
import { Eye, EyeOff } from "lucide-react";

const LEMBRAR_KEY = "cg.lembrar.email";

// Proporções idênticas ao login do Meraki Publisher (card 416px, título 30px,
// botão pílula 50px, descrição centralizada), na identidade da plataforma.
export default function Login({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [email, setEmail] = useState(() => localStorage.getItem(LEMBRAR_KEY) ?? "");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [lembrar, setLembrar] = useState(() => !!localStorage.getItem(LEMBRAR_KEY));
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErro(null);
    try {
      const { usuario } = await api.login(email.trim(), senha);
      if (lembrar) localStorage.setItem(LEMBRAR_KEY, email.trim());
      else localStorage.removeItem(LEMBRAR_KEY);
      onLogin(usuario);
    } catch (err) {
      const m = (err as Error).message;
      setErro(/401|inv/i.test(m) ? "E-mail ou senha incorretos." : "Não consegui entrar agora. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const labelCls = "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-lo)]";
  const inputCls = "w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[var(--glass-brd-h)] focus:bg-white/5 placeholder:text-[var(--text-lo)]";

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] p-7">
      <form onSubmit={entrar} className="glass relative w-full max-w-[416px] rounded-[26px] px-[34px] pb-[30px] pt-10">
        <div className="mb-[22px] flex justify-center">
          <MerakiWordmark height={40} />
        </div>
        <h1 className="text-center text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-white">Login</h1>
        <p className="mx-auto mb-[26px] mt-[9px] max-w-[32ch] text-center text-[13.5px] leading-[1.6] text-[var(--text-md)]">
          Gere, edite e organize os <b className="font-semibold text-white">carrosséis dos clientes</b> da Meraki — a biblioteca é compartilhada por toda a equipe.
        </p>

        {erro && <div className="mb-[15px] rounded-xl border border-red-400/40 bg-red-400/10 px-3.5 py-2.5 text-[13px] text-[#f3a7ae]">{erro}</div>}

        <div className="mb-[15px] flex flex-col gap-[7px]">
          <label htmlFor="email" className={labelCls}>E-mail</label>
          <input id="email" type="email" autoFocus autoComplete="username" placeholder="voce@merakidigital.cloud" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
        </div>

        <div className="mb-[15px] flex flex-col gap-[7px]">
          <label htmlFor="senha" className={labelCls}>Senha</label>
          <div className="relative">
            <input id="senha" type={verSenha ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} className={`${inputCls} pr-12`} required />
            <button type="button" onClick={() => setVerSenha((v) => !v)} title={verSenha ? "Ocultar senha" : "Mostrar senha"} className="absolute right-1.5 top-1/2 grid h-[34px] w-[34px] -translate-y-1/2 place-items-center rounded-[10px] text-[var(--text-lo)] transition hover:bg-white/5 hover:text-white">
              {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary mt-2 min-h-[50px] w-full !rounded-full text-sm" disabled={busy || !email || !senha}>
          {busy ? "Entrando…" : "Entrar"}
        </button>

        <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5 text-[12.5px] text-[var(--text-md)]">
          <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} style={{ accentColor: "var(--brand-sat)" }} />
          Lembrar meu e-mail
        </label>
      </form>
    </div>
  );
}
