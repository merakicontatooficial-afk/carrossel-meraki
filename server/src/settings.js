// Configuração da IA editável pela interface (aba Configurações, só a conta dona).
// Ordem de precedência: o que está no BANCO manda; se não houver, cai no .env;
// se não houver nem isso, no padrão do código. Assim dá pra trocar chave/modelo
// sem editar arquivo no servidor nem reiniciar o serviço.
import { db } from "./db.js";

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  chave          TEXT PRIMARY KEY,
  valor          TEXT,
  atualizado_em  INTEGER,
  atualizado_por TEXT
);
CREATE TABLE IF NOT EXISTS ai_usage (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  ts           INTEGER NOT NULL,
  tipo         TEXT NOT NULL,          -- 'imagem'
  modelo       TEXT NOT NULL,          -- id do modelo no Google
  nivel        TEXT,                   -- lite | flash | pro
  custo_usd    REAL NOT NULL DEFAULT 0,
  usuario_id   INTEGER,
  usuario_nome TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_ts ON ai_usage (ts);
`);

/** Padrões do código — último degrau, quando não há banco nem .env. */
export const PADROES = {
  modelo_texto: "gemini-flash-latest",
  modelo_img_lite: "gemini-3.1-flash-lite-image",
  modelo_img_flash: "gemini-3.1-flash-image",
  modelo_img_pro: "gemini-3-pro-image",
};

/** Nome da variável de ambiente equivalente a cada chave. */
const ENV = {
  gemini_api_key: "GEMINI_API_KEY",
  modelo_texto: "GEMINI_MODEL_TEXT",
  modelo_img_lite: "GEMINI_MODEL_IMAGE_LITE",
  modelo_img_flash: "GEMINI_MODEL_IMAGE_FLASH",
  modelo_img_pro: "GEMINI_MODEL_IMAGE_PRO",
};

const selectOne = db.prepare("SELECT valor FROM settings WHERE chave = ?");
const upsert = db.prepare(`
  INSERT INTO settings (chave, valor, atualizado_em, atualizado_por) VALUES (?,?,?,?)
  ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, atualizado_em = excluded.atualizado_em, atualizado_por = excluded.atualizado_por
`);

/** Valor efetivo: banco → .env → padrão. */
export function get(chave) {
  const row = selectOne.get(chave);
  const doBanco = row?.valor;
  if (doBanco != null && String(doBanco).trim() !== "") return String(doBanco);
  const doEnv = ENV[chave] ? process.env[ENV[chave]] : undefined;
  if (doEnv && String(doEnv).trim() !== "") return String(doEnv);
  return PADROES[chave] ?? "";
}

/** De onde veio o valor — a interface mostra isso pra não haver dúvida. */
export function origem(chave) {
  const row = selectOne.get(chave);
  if (row?.valor && String(row.valor).trim() !== "") return "painel";
  const doEnv = ENV[chave] ? process.env[ENV[chave]] : undefined;
  if (doEnv && String(doEnv).trim() !== "") return "servidor";
  return "padrao";
}

export function set(chave, valor, porQuem = "") {
  upsert.run(chave, valor == null ? null : String(valor), Date.now(), String(porQuem));
}

/** Volta a usar o que está no .env (apaga o override do banco). */
export function limpar(chave) {
  db.prepare("DELETE FROM settings WHERE chave = ?").run(chave);
}

export function atualizadoEm(chave) {
  const r = db.prepare("SELECT atualizado_em, atualizado_por FROM settings WHERE chave = ?").get(chave);
  return r ? { em: r.atualizado_em, por: r.atualizado_por } : null;
}

/** "AIzaSy…4Xm" — nunca devolvemos a chave inteira pro navegador. */
export function mascarar(valor) {
  const s = String(valor || "");
  if (!s) return "";
  if (s.length <= 12) return `${s.slice(0, 3)}…${s.slice(-2)}`;
  return `${s.slice(0, 6)}…${s.slice(-4)}`;
}

// ── consumo ──────────────────────────────────────────────────────────────────

/** US$ por imagem (preço oficial Google, tabela de 29/07/2026).
 *  O Pro sai em 2K, que custa o MESMO que 1K. */
export const CUSTO_IMAGEM_USD = { lite: 0.0336, flash: 0.067, pro: 0.134 };

export function registrarUso({ tipo = "imagem", modelo, nivel, custoUsd = 0, usuario }) {
  db.prepare(
    "INSERT INTO ai_usage (ts, tipo, modelo, nivel, custo_usd, usuario_id, usuario_nome) VALUES (?,?,?,?,?,?,?)"
  ).run(Date.now(), tipo, String(modelo || ""), nivel || null, Number(custoUsd) || 0, usuario?.id ?? null, usuario?.nome ?? null);
}

/** Consumo do mês corrente + últimos 30 dias, agrupado por nível. */
export function resumoUso() {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1).getTime();
  const trintaDias = Date.now() - 30 * 24 * 3600 * 1000;

  const porNivel = db
    .prepare("SELECT nivel, COUNT(*) AS n, SUM(custo_usd) AS usd FROM ai_usage WHERE ts >= ? GROUP BY nivel")
    .all(inicioMes)
    .map((r) => ({ nivel: r.nivel || "?", imagens: r.n, usd: Number(r.usd || 0) }));

  const total = (desde) => {
    const r = db.prepare("SELECT COUNT(*) AS n, SUM(custo_usd) AS usd FROM ai_usage WHERE ts >= ?").get(desde);
    return { imagens: r?.n || 0, usd: Number(r?.usd || 0) };
  };

  const ultima = db.prepare("SELECT ts, modelo, usuario_nome FROM ai_usage ORDER BY ts DESC LIMIT 1").get();

  return {
    mes: total(inicioMes),
    trintaDias: total(trintaDias),
    porNivel,
    ultima: ultima ? { em: ultima.ts, modelo: ultima.modelo, por: ultima.usuario_nome } : null,
  };
}
