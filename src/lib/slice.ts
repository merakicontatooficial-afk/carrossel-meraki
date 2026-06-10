import { CANVAS_H, CANVAS_W } from "../types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/**
 * Carrossel contínuo: escala a imagem wide para 1350 de altura e fatia
 * em N tiras 1080×1350 alinhadas — uma por slide. Sem IA, só canvas.
 */
export async function sliceWideImage(dataUrl: string, fillColor = "#101014"): Promise<string[]> {
  const img = await loadImage(dataUrl);
  const scale = CANVAS_H / img.height;
  const scaledW = img.width * scale;
  const n = Math.max(1, Math.min(10, Math.ceil(scaledW / CANVAS_W)));

  const slices: string[] = [];
  for (let i = 0; i < n; i++) {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // fatia i em coordenadas da imagem original
    const sx = (i * CANVAS_W) / scale;
    const sw = Math.min(CANVAS_W / scale, img.width - sx);
    ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, sw * scale, CANVAS_H);
    slices.push(canvas.toDataURL("image/jpeg", 0.92));
  }
  return slices;
}
