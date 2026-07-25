// Cliente do backend de IA (server/). Em dev, o Vite faz proxy de /api → :8787.

export interface BrandVoice {
  nome?: string;
  nicho?: string;
  tomDeVoz?: string;
  publico?: string;
  usar?: string;
  evitar?: string;
  exemplos?: string;
}

export type AiModelo = "minimalista" | "profile" | "creators" | "techviral";

export interface AiSlide {
  kind: "cover" | "value" | "proof" | "cta";
  eyebrow?: string;
  headline: string;
  body?: string;
}

export interface AiCarousel {
  slides: AiSlide[];
  legenda?: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erro ${res.status}`);
  return data as T;
}

export const api = {
  async health(): Promise<{ ok: boolean; hasKey: boolean }> {
    const res = await fetch("/api/health");
    return res.json();
  },

  generateCarousel(input: { tema: string; nSlides: number; modelo: AiModelo; marca?: BrandVoice; idioma?: string }) {
    return post<AiCarousel>("/api/generate/carousel", input);
  },

  generateImage(input: { prompt: string; refImageBase64?: string; refMime?: string; hq?: boolean }) {
    return post<{ dataUrl: string; model: string }>("/api/generate/image", input);
  },

  refineSlide(input: { texto: string; instrucao: string; marca?: BrandVoice }) {
    return post<{ texto: string }>("/api/generate/refine", input);
  },

  generateCaption(input: { tema?: string; slides?: AiSlide[]; marca?: BrandVoice }) {
    return post<{ legenda: string }>("/api/generate/caption", input);
  },

  async trends(q: string, period = "semana", limit = 8) {
    const res = await fetch(`/api/generate/trends?q=${encodeURIComponent(q)}&period=${period}&limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao buscar trends");
    return data.items as { titulo: string; fonte: string; quando: string; resumo: string }[];
  },
};
