// Extração de paleta por quantização (median cut) no canvas — sem IA, sem libs.

type RGB = [number, number, number];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function samplePixels(img: HTMLImageElement, size = 96): RGB[] {
  const canvas = document.createElement("canvas");
  const ratio = Math.min(size / img.width, size / img.height, 1);
  canvas.width = Math.max(1, Math.round(img.width * ratio));
  canvas.height = Math.max(1, Math.round(img.height * ratio));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const px: RGB[] = [];
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 128) px.push([data[i], data[i + 1], data[i + 2]]);
  }
  return px;
}

function medianCut(pixels: RGB[], depth: number): RGB[] {
  if (depth === 0 || pixels.length === 0) {
    if (pixels.length === 0) return [];
    const avg = pixels
      .reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1], acc[2] + p[2]] as RGB, [0, 0, 0] as RGB)
      .map((v) => Math.round(v / pixels.length)) as RGB;
    return [avg];
  }
  // canal de maior amplitude
  let bestChannel = 0;
  let bestRange = -1;
  for (let c = 0; c < 3; c++) {
    let min = 255;
    let max = 0;
    for (const p of pixels) {
      if (p[c] < min) min = p[c];
      if (p[c] > max) max = p[c];
    }
    if (max - min > bestRange) {
      bestRange = max - min;
      bestChannel = c;
    }
  }
  const sorted = [...pixels].sort((a, b) => a[bestChannel] - b[bestChannel]);
  const mid = Math.floor(sorted.length / 2);
  return [...medianCut(sorted.slice(0, mid), depth - 1), ...medianCut(sorted.slice(mid), depth - 1)];
}

const toHex = ([r, g, b]: RGB) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

function luminance([r, g, b]: RGB): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function saturation([r, g, b]: RGB): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

export interface PaletteSuggestion {
  palette: string[]; // 8 cores dominantes
  bg: string;
  text: string;
  accent: string;
}

/** Extrai cores dominantes e sugere tokens bg/text/accent. */
export async function extractPalette(dataUrl: string): Promise<PaletteSuggestion> {
  const img = await loadImage(dataUrl);
  const pixels = samplePixels(img);
  const colors = medianCut(pixels, 3); // 2^3 = 8 cores

  const byLum = [...colors].sort((a, b) => luminance(a) - luminance(b));
  const darkest = byLum[0] ?? ([20, 20, 24] as RGB);
  const lightest = byLum[byLum.length - 1] ?? ([240, 240, 245] as RGB);

  // accent: maior saturação entre cores nem muito escuras nem muito claras
  const candidates = colors.filter((c) => {
    const l = luminance(c);
    return l > 40 && l < 220;
  });
  const accent =
    [...(candidates.length ? candidates : colors)].sort((a, b) => saturation(b) - saturation(a))[0] ??
    ([91, 141, 239] as RGB);

  // garante contraste mínimo do texto sobre o fundo
  const text = luminance(lightest) - luminance(darkest) < 100 ? ([242, 242, 245] as RGB) : lightest;

  return {
    palette: colors.map(toHex),
    bg: toHex(darkest),
    text: toHex(text),
    accent: toHex(accent),
  };
}
