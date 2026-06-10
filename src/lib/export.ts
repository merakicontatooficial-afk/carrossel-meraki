import { createElement } from "react";
import { createRoot } from "react-dom/client";
import * as htmlToImage from "html-to-image";
import JSZip from "jszip";
import type { BrandKit, Carousel } from "../types";
import { CANVAS_H, CANVAS_W } from "../types";
import SlideCanvas from "../components/SlideCanvas";

async function waitForImages(node: HTMLElement) {
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? img.decode().catch(() => undefined)
        : new Promise<void>((res) => {
            img.onload = () => res();
            img.onerror = () => res();
          })
    )
  );
}

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** Renderiza cada slide num node real 1080×1350 offscreen e exporta PNG → zip. */
export async function exportCarousel(
  carousel: Carousel,
  kit: BrandKit,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${CANVAS_W}px;height:${CANVAS_H}px;overflow:hidden;`;
  document.body.appendChild(host);
  const root = createRoot(host);

  const zip = new JSZip();
  await document.fonts.ready;

  try {
    for (let i = 0; i < carousel.slides.length; i++) {
      root.render(
        createElement(SlideCanvas, {
          slide: carousel.slides[i],
          kit,
          carousel,
          slideIndex: i,
          mode: "export",
        })
      );
      await nextFrame();
      await waitForImages(host);
      await nextFrame();

      const node = host.firstElementChild as HTMLElement;
      const dataUrl = await htmlToImage.toPng(node, {
        width: CANVAS_W,
        height: CANVAS_H,
        pixelRatio: 1,
        skipFonts: false,
      });
      zip.file(`slide-${String(i + 1).padStart(2, "0")}.png`, dataUrl.split(",")[1], { base64: true });
      onProgress?.(i + 1, carousel.slides.length);
    }
  } finally {
    root.unmount();
    host.remove();
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  const slug = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "carrossel";
  const name = `${slug(carousel.name)}-${slug(carousel.templateId)}-${date}.zip`;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
