// Compressão de imagem NO CLIENTE (segura o peso da VPS). Toda imagem nova entra
// como dataURL; antes de subir pro servidor, reduz p/ ~1350px e converte pra WebP.
// URLs do servidor (/api/media/*) e strings não-imagem passam intactas.
import type { Carousel, Template } from "../types";

const MAX = 1350; // maior lado do canvas
const QUALITY = 0.82;

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function compress(src: string): Promise<string> {
  if (typeof src !== "string" || !src.startsWith("data:image/")) return src;
  try {
    const img = await loadImg(src);
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, w, h);
    const webp = canvas.toDataURL("image/webp", QUALITY);
    return webp.startsWith("data:image/webp") ? webp : src; // fallback se sem suporte
  } catch {
    return src;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function walk(data: any): Promise<void> {
  for (const s of data?.slides || []) {
    if (typeof s.bgImage === "string" && s.bgImage.startsWith("data:")) s.bgImage = await compress(s.bgImage);
    for (const el of s.elements || []) {
      if (typeof el.src === "string" && el.src.startsWith("data:")) el.src = await compress(el.src);
    }
  }
  if (typeof data?.logo?.src === "string" && data.logo.src.startsWith("data:")) data.logo.src = await compress(data.logo.src);
  if (typeof data?.kit?.logo === "string" && data.kit.logo.startsWith("data:")) data.kit.logo = await compress(data.kit.logo);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function compressCarouselMedia(c: Carousel): Promise<Carousel> {
  const clone = structuredClone(c);
  await walk(clone);
  return clone;
}
export async function compressTemplateMedia(t: Template): Promise<Template> {
  const clone = structuredClone(t);
  await walk(clone);
  return clone;
}
