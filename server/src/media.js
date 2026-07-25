// Mídia como ARQUIVO em disco (não dataURL no banco) — segura o peso da VPS.
// - dataURL recebido → salvo como arquivo nomeado pelo hash do conteúdo (DEDUP).
// - refcount por hash: incrementa quando um carrossel/template passa a usar,
//   decrementa quando deixa de usar; ao chegar a 0, o ARQUIVO É APAGADO.
// A imagem já chega comprimida (WebP) do cliente; aqui só persistimos.
import { createHash } from "crypto";
import { writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { db, MEDIA_DIR } from "./db.js";

const DATAURL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

function extFromMime(mime) {
  if (mime.includes("webp")) return "webp";
  if (mime.includes("png")) return "png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return "jpg";
  if (mime.includes("gif")) return "gif";
  return "bin";
}

const hashFromUrl = (url) => {
  const f = String(url).split("/").pop() || "";
  return f.split(".")[0] || null;
};

// salva um dataURL como arquivo (por hash) e devolve a URL /api/media/<hash>.<ext>
function saveDataUrl(dataUrl) {
  const m = DATAURL_RE.exec(dataUrl);
  if (!m) return dataUrl;
  const buf = Buffer.from(m[2], "base64");
  const hash = createHash("sha256").update(buf).digest("hex").slice(0, 32);
  const ext = extFromMime(m[1]);
  const file = `${hash}.${ext}`;
  if (!existsSync(join(MEDIA_DIR, file))) writeFileSync(join(MEDIA_DIR, file), buf);
  if (!db.prepare("SELECT 1 FROM media WHERE hash = ?").get(hash)) {
    db.prepare("INSERT INTO media (hash, ext, bytes, refcount, created_at) VALUES (?,?,?,0,?)").run(hash, ext, buf.length, Date.now());
  }
  return `/api/media/${file}`;
}

// aplica `fn` em todo campo de imagem de um Carousel/Template
function walkImages(data, fn) {
  for (const s of data?.slides || []) {
    if (typeof s.bgImage === "string" && s.bgImage.startsWith("data:")) s.bgImage = fn(s.bgImage);
    for (const el of s.elements || []) {
      if (typeof el.src === "string" && el.src.startsWith("data:")) el.src = fn(el.src);
    }
  }
  if (data?.logo && typeof data.logo.src === "string" && data.logo.src.startsWith("data:")) data.logo.src = fn(data.logo.src);
  if (data?.kit && typeof data.kit.logo === "string" && data.kit.logo.startsWith("data:")) data.kit.logo = fn(data.kit.logo);
}

// coleta as URLs /api/media/* referenciadas num Carousel/Template
export function collectMediaUrls(data) {
  const urls = new Set();
  const add = (v) => { if (typeof v === "string" && v.startsWith("/api/media/")) urls.add(v); };
  for (const s of data?.slides || []) {
    add(s.bgImage);
    for (const el of s.elements || []) add(el.src);
  }
  add(data?.logo?.src);
  add(data?.kit?.logo);
  return urls;
}

function refInc(hash) {
  if (hash) db.prepare("UPDATE media SET refcount = refcount + 1 WHERE hash = ?").run(hash);
}
function refDec(hash) {
  if (!hash) return;
  db.prepare("UPDATE media SET refcount = MAX(0, refcount - 1) WHERE hash = ?").run(hash);
  const row = db.prepare("SELECT hash, ext, refcount FROM media WHERE hash = ?").get(hash);
  if (row && row.refcount <= 0) {
    try { unlinkSync(join(MEDIA_DIR, `${row.hash}.${row.ext}`)); } catch { /* já foi */ }
    db.prepare("DELETE FROM media WHERE hash = ?").run(hash);
  }
}

/**
 * Ao salvar: converte dataURLs em arquivos e ajusta refcounts pelo DIFF
 * (novas urls incrementam, urls removidas decrementam → apaga órfãs).
 * `prevUrls` = Set das URLs que a entidade usava ANTES (vazio na criação).
 * Muta `data` in-place (dataURL → URL). Retorna o Set de URLs atuais.
 */
export function persistMedia(data, prevUrls = new Set()) {
  walkImages(data, saveDataUrl);
  const now = collectMediaUrls(data);
  for (const url of now) if (!prevUrls.has(url)) refInc(hashFromUrl(url));
  for (const url of prevUrls) if (!now.has(url)) refDec(hashFromUrl(url));
  return now;
}

/** Ao apagar uma entidade: solta todas as referências (apaga órfãs). */
export function releaseMedia(urls) {
  for (const url of urls) refDec(hashFromUrl(url));
}
