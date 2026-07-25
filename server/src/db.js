// Persistência da plataforma — SQLite (padrão CRM/Publisher).
// Guarda só TEXTO/JSON (carrosséis/templates/coleções) + tabela de mídia (metadados).
// A mídia em si vive como ARQUIVO em disco (ver media.js). Os USUÁRIOS vêm do
// banco do Meraki Publisher (somente leitura) — mesmos acessos e senhas.
import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), "data");
export const MEDIA_DIR = join(DATA_DIR, "media");
mkdirSync(MEDIA_DIR, { recursive: true });

export const db = new Database(join(DATA_DIR, "carrossel.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS carousels (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  owner_id      INTEGER,
  owner_name    TEXT,
  status        TEXT NOT NULL DEFAULT 'rascunho',
  collection_id TEXT,
  data          TEXT NOT NULL,        -- JSON do Carousel (mídia como URL /api/media/*)
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  owner_id   INTEGER,
  owner_name TEXT,
  data       TEXT NOT NULL,           -- JSON do Template
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS collections (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT
);
CREATE TABLE IF NOT EXISTS media (
  hash       TEXT PRIMARY KEY,        -- sha256(conteúdo) truncado
  ext        TEXT NOT NULL,
  bytes      INTEGER NOT NULL,
  refcount   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
`);

// Banco de usuários do Publisher — SOMENTE LEITURA (mesmos logins/senhas).
let usersDb = null;
export function getUsersDb() {
  if (usersDb) return usersDb;
  const path = process.env.USERS_DB_PATH;
  if (!path) return null;
  try {
    usersDb = new Database(path, { readonly: true, fileMustExist: true });
    return usersDb;
  } catch (e) {
    console.error("[db] não abriu USERS_DB_PATH:", e.message);
    return null;
  }
}
