// Persistência compartilhada — carrosséis/templates/coleções (protegido por login)
// + serviço público de mídia. Biblioteca é da EQUIPE: todos veem tudo, com autor e
// status, e podem clonar qualquer um como base (o clone é uma criação nova do POST).
import { Router } from "express";
import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { join } from "path";
import { db, MEDIA_DIR, getUsersDb } from "../db.js";
import { autenticar } from "../auth.js";
import { persistMedia, releaseMedia, collectMediaUrls } from "../media.js";

// ---- mídia (PÚBLICO — as imagens são carregadas em <img>) ----
export const mediaRouter = Router();
mediaRouter.get("/:file", (req, res) => {
  const file = String(req.params.file).replace(/[^a-zA-Z0-9._-]/g, "");
  const path = join(MEDIA_DIR, file);
  if (!existsSync(path)) return res.status(404).end();
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.sendFile(path);
});

// ---- dados (PROTEGIDO) ----
const router = Router();
router.use(autenticar);

router.get("/me", (req, res) => res.json({ usuario: req.usuario }));

// ===== acessos (quem tem acesso) — só admin, leitura da base do Publisher =====
router.get("/users", (req, res) => {
  if (req.usuario?.papel !== "admin") return res.status(403).json({ error: "apenas admin" });
  const udb = getUsersDb();
  if (!udb) return res.json({ users: [] });
  const cols = udb.prepare("PRAGMA table_info(usuarios)").all().map((c) => c.name);
  const has = (c) => cols.includes(c);
  const rows = udb.prepare("SELECT * FROM usuarios ORDER BY nome").all();
  res.json({
    users: rows.map((u) => ({
      id: u.id,
      nome: u.nome,
      email: u.email,
      papel: u.papel,
      ativo: has("ativo") ? (u.ativo ? 1 : 0) : 1,
      dono: has("dono") ? (u.dono ? 1 : 0) : 0,
      criadoEm: has("criado_em") ? u.criado_em : has("created_at") ? u.created_at : null,
    })),
  });
});

// ===== carrosséis =====
router.get("/carousels", (_req, res) => {
  const rows = db.prepare("SELECT * FROM carousels ORDER BY updated_at DESC").all();
  res.json(rows.map(rowToCarousel));
});

router.get("/carousels/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM carousels WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "não encontrado" });
  res.json(rowToCarousel(row));
});

router.post("/carousels", (req, res) => {
  const c = req.body?.carousel;
  if (!c) return res.status(400).json({ error: "envie { carousel }" });
  const id = (c.id && String(c.id)) || randomUUID();
  persistMedia(c, new Set());
  const now = Date.now();
  db.prepare(`INSERT INTO carousels (id, name, owner_id, owner_name, status, collection_id, data, created_at, updated_at)
              VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, c.name || "Sem nome", req.usuario.id, req.usuario.nome, c.status || "rascunho", c.collectionId ?? null, JSON.stringify(c), now, now);
  res.json(rowToCarousel(db.prepare("SELECT * FROM carousels WHERE id = ?").get(id)));
});

router.put("/carousels/:id", (req, res) => {
  const old = db.prepare("SELECT * FROM carousels WHERE id = ?").get(req.params.id);
  if (!old) return res.status(404).json({ error: "não encontrado" });
  const c = req.body?.carousel;
  if (!c) return res.status(400).json({ error: "envie { carousel }" });
  persistMedia(c, collectMediaUrls(JSON.parse(old.data)));
  db.prepare("UPDATE carousels SET name=?, status=?, collection_id=?, data=?, updated_at=? WHERE id=?")
    .run(c.name || old.name, c.status || old.status, c.collectionId ?? old.collection_id ?? null, JSON.stringify(c), Date.now(), req.params.id);
  res.json(rowToCarousel(db.prepare("SELECT * FROM carousels WHERE id = ?").get(req.params.id)));
});

router.patch("/carousels/:id/status", (req, res) => {
  const r = db.prepare("UPDATE carousels SET status=?, updated_at=? WHERE id=?")
    .run(String(req.body?.status || "rascunho"), Date.now(), req.params.id);
  if (!r.changes) return res.status(404).json({ error: "não encontrado" });
  res.json({ ok: true });
});

router.delete("/carousels/:id", (req, res) => {
  const old = db.prepare("SELECT data FROM carousels WHERE id = ?").get(req.params.id);
  if (old) {
    releaseMedia(collectMediaUrls(JSON.parse(old.data)));
    db.prepare("DELETE FROM carousels WHERE id = ?").run(req.params.id);
  }
  res.json({ ok: true });
});

// ===== templates =====
router.get("/templates", (_req, res) => {
  res.json(db.prepare("SELECT * FROM templates ORDER BY created_at DESC").all().map(rowToTemplate));
});

router.post("/templates", (req, res) => {
  const t = req.body?.template;
  if (!t) return res.status(400).json({ error: "envie { template }" });
  const id = (t.id && String(t.id)) || randomUUID();
  persistMedia(t, new Set());
  db.prepare("INSERT INTO templates (id, name, owner_id, owner_name, data, created_at) VALUES (?,?,?,?,?,?)")
    .run(id, t.name || "Template", req.usuario.id, req.usuario.nome, JSON.stringify(t), Date.now());
  res.json(rowToTemplate(db.prepare("SELECT * FROM templates WHERE id = ?").get(id)));
});

router.delete("/templates/:id", (req, res) => {
  const old = db.prepare("SELECT data FROM templates WHERE id = ?").get(req.params.id);
  if (old) {
    releaseMedia(collectMediaUrls(JSON.parse(old.data)));
    db.prepare("DELETE FROM templates WHERE id = ?").run(req.params.id);
  }
  res.json({ ok: true });
});

// ===== coleções (clientes) =====
router.get("/collections", (_req, res) => res.json(db.prepare("SELECT * FROM collections ORDER BY name").all()));

router.post("/collections", (req, res) => {
  const { id, name, color } = req.body || {};
  const cid = id || randomUUID();
  db.prepare("INSERT OR REPLACE INTO collections (id, name, color) VALUES (?,?,?)").run(cid, name || "Coleção", color || "#5103c1");
  res.json({ id: cid, name, color });
});

router.delete("/collections/:id", (req, res) => {
  db.prepare("DELETE FROM collections WHERE id = ?").run(req.params.id);
  db.prepare("UPDATE carousels SET collection_id = NULL WHERE collection_id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ---- helpers de serialização (a coluna manda; o JSON carrega o resto) ----
function rowToCarousel(r) {
  const c = JSON.parse(r.data);
  c.id = r.id;
  c.name = r.name;
  c.collectionId = r.collection_id || undefined;
  c.ownerId = r.owner_id;
  c.ownerName = r.owner_name;
  c.status = r.status;
  c.updatedAt = r.updated_at;
  return c;
}
function rowToTemplate(r) {
  const t = JSON.parse(r.data);
  t.id = r.id;
  t.name = r.name;
  t.ownerId = r.owner_id;
  t.ownerName = r.owner_name;
  return t;
}

export default router;
