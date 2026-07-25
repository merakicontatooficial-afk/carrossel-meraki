// Autenticação — reaproveita os USUÁRIOS do Meraki Publisher (mesmo esquema:
// bcryptjs + JWT). Login por email+senha contra a tabela `usuarios` (só leitura);
// o token usa o MESMO JWT_SECRET do Publisher, então as contas são compartilhadas.
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsersDb } from "./db.js";

const SECRET = process.env.JWT_SECRET || "";
const EXPIRES = process.env.JWT_EXPIRES_IN || "12h";

function buscarUsuarioPorEmail(email) {
  const udb = getUsersDb();
  if (!udb) return null;
  return udb.prepare("SELECT * FROM usuarios WHERE email = ?").get(email) || null;
}

export function nomeUsuario(id) {
  const udb = getUsersDb();
  const u = udb?.prepare("SELECT nome FROM usuarios WHERE id = ?").get(id);
  return u?.nome || "Equipe";
}

export async function login(email, senha) {
  if (!SECRET) throw new Error("JWT_SECRET não configurado");
  const u = buscarUsuarioPorEmail(String(email || "").trim());
  // respeita `ativo` se a coluna existir
  if (!u || (u.ativo !== undefined && u.ativo !== null && !u.ativo)) return null;
  const ok = await bcrypt.compare(String(senha || ""), u.senha_hash);
  if (!ok) return null;
  const token = jwt.sign({ sub: u.id, papel: u.papel }, SECRET, { expiresIn: EXPIRES });
  return { token, usuario: { id: u.id, nome: u.nome, papel: u.papel } };
}

/** Middleware: exige Bearer token válido; anexa req.usuario = {id, papel, nome}. */
export function autenticar(req, res, next) {
  const m = (req.header("authorization") || "").match(/^Bearer (.+)$/i);
  if (!m) return res.status(401).json({ error: "token ausente" });
  try {
    const p = jwt.verify(m[1], SECRET);
    req.usuario = { id: p.sub, papel: p.papel, nome: nomeUsuario(p.sub) };
    next();
  } catch {
    return res.status(401).json({ error: "token inválido ou expirado" });
  }
}
