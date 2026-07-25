import { useState } from "react";
import { api, type Usuario } from "../../lib/api";
import MerakiMark from "../Shell/MerakiMark";
import { Loader2, LogIn } from "lucide-react";

export default function Login({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErro(null);
    try {
      const { usuario } = await api.login(email.trim(), senha);
      onLogin(usuario);
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4">
      <form onSubmit={entrar} className="glass w-full max-w-sm !rounded-[26px] p-7">
        <div className="mb-6 flex items-center gap-2.5">
          <MerakiMark size={26} />
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-tight text-white">meraki</div>
            <div className="text-[8px] font-medium tracking-[0.25em] text-white/45">CARROSSÉIS</div>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-white">Entrar</h1>
        <p className="mb-5 mt-1 text-xs text-[var(--text-md)]">Use o mesmo login do Meraki Publisher.</p>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs text-[var(--text-md)]">E-mail</span>
          <input
            type="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]"
            placeholder="voce@meraki"
          />
        </label>
        <label className="mb-4 block">
          <span className="mb-1 block text-xs text-[var(--text-md)]">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]"
            placeholder="••••••••"
          />
        </label>

        {erro && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-[12px] text-red-300">{erro}</p>}

        <button type="submit" className="btn btn-primary w-full" disabled={busy || !email || !senha}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} Entrar
        </button>
      </form>
    </div>
  );
}
