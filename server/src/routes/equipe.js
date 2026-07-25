// Gestão de acessos — SÓ a conta DONA (admin principal da Meraki).
// Espelha o Meraki Publisher: cria, edita (nome/papel/ativo), reseta senha e
// remove acesso. As contas são as MESMAS (tabela `usuarios` compartilhada), então
// "remover acesso" = DESATIVAR (ativo=0) — igual ao Publisher, que não faz
// hard-delete pra não quebrar contas/histórico. bcrypt rounds 12 (idêntico).
import { Router } from "express";
import bcrypt from "bcryptjs";
import { getUsersDbRW } from "../db.js";
import { autenticar, exigirDono } from "../auth.js";

const router = Router();
router.use(autenticar, exigirDono);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const pub = (u) => ({ id: u.id, nome: u.nome, email: u.email, papel: u.papel, ativo: u.ativo ? 1 : 0, dono: u.dono ? 1 : 0, criadoEm: u.criado_em ?? null });
const PAPEIS = ["admin", "colaborador"];

router.get("/", (_req, res) => {
  const db = getUsersDbRW();
  if (!db) return res.json([]);
  res.json(db.prepare("SELECT * FROM usuarios ORDER BY nome").all().map(pub));
});

router.post(
  "/",
  wrap(async (req, res) => {
    const { nome, email, senha, papel = "colaborador" } = req.body || {};
    if (!nome || !email || !senha || String(senha).length < 6) return res.status(400).json({ error: "nome, e-mail e senha (mín. 6) são obrigatórios" });
    if (!PAPEIS.includes(papel)) return res.status(400).json({ error: "papel inválido" });
    const db = getUsersDbRW();
    try {
      const hash = await bcrypt.hash(String(senha), 12);
      const info = db.prepare("INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?,?,?,?)").run(String(nome).trim(), String(email).trim(), hash, papel);
      res.status(201).json(pub(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(info.lastInsertRowid)));
    } catch (e) {
      if (String(e.code || "").includes("CONSTRAINT")) return res.status(409).json({ error: "já existe um acesso com esse e-mail" });
      throw e;
    }
  })
);

router.patch("/:id", (req, res) => {
  const db = getUsersDbRW();
  const id = Number(req.params.id);
  const alvo = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
  if (!alvo) return res.status(404).json({ error: "acesso não encontrado" });
  const { nome, papel, ativo } = req.body || {};
  if (alvo.dono === 1 && (papel !== undefined || ativo !== undefined)) return res.status(400).json({ error: "a conta principal não pode ter papel/ativo alterados" });
  const sets = [], vals = [];
  if (nome !== undefined) { sets.push("nome = ?"); vals.push(String(nome).trim()); }
  if (papel !== undefined) { if (!PAPEIS.includes(papel)) return res.status(400).json({ error: "papel inválido" }); sets.push("papel = ?"); vals.push(papel); }
  if (ativo !== undefined) { sets.push("ativo = ?"); vals.push(ativo ? 1 : 0); }
  if (sets.length) db.prepare(`UPDATE usuarios SET ${sets.join(", ")} WHERE id = ?`).run(...vals, id);
  res.json(pub(db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id)));
});

router.post(
  "/:id/senha",
  wrap(async (req, res) => {
    const db = getUsersDbRW();
    const id = Number(req.params.id);
    if (!db.prepare("SELECT 1 FROM usuarios WHERE id = ?").get(id)) return res.status(404).json({ error: "acesso não encontrado" });
    const { senha } = req.body || {};
    if (!senha || String(senha).length < 6) return res.status(400).json({ error: "senha muito curta (mín. 6)" });
    const hash = await bcrypt.hash(String(senha), 12);
    db.prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?").run(hash, id);
    res.json({ ok: true });
  })
);

// remover acesso = desativar (revoga o login). O dono não pode ser removido.
router.delete("/:id", (req, res) => {
  const db = getUsersDbRW();
  const id = Number(req.params.id);
  const alvo = db.prepare("SELECT * FROM usuarios WHERE id = ?").get(id);
  if (!alvo) return res.status(404).json({ error: "acesso não encontrado" });
  if (alvo.dono === 1) return res.status(400).json({ error: "a conta principal não pode ser removida" });
  db.prepare("UPDATE usuarios SET ativo = 0 WHERE id = ?").run(id);
  res.json({ ok: true, desativado: true });
});

export default router;
