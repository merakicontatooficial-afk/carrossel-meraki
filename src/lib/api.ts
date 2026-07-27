// Cliente do backend (server/). Em dev, o Vite faz proxy de /api → :8787.
// Persistência é COMPARTILHADA (servidor): login por email+senha (usuários do
// Meraki Publisher), carrosséis/templates/coleções da equipe, mídia em disco.
import type { BrandKit, Carousel, Collection, Slide, Template } from "../types";
import { compressCarouselMedia, compressTemplateMedia } from "./imagePrep";

export interface BrandVoice {
  nome?: string;
  /** dossiê .md da marca (cadastrado em Organização) — contexto forte pra IA */
  brief?: string;
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

export interface Usuario {
  id: number;
  nome: string;
  papel: "admin" | "colaborador";
  dono?: number; // 1 = conta principal da Meraki (única que gerencia acessos)
}

// ── token (sessão) ───────────────────────────────────────────────────────────
const TOKEN_KEY = "cg.token.v1";
let token: string | null = localStorage.getItem(TOKEN_KEY);
export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getToken() {
  return token;
}

function authHeaders(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function req<T>(path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: authHeaders(body !== undefined),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    setToken(null);
    throw new Error("Sessão expirada. Faça login de novo.");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || `Erro ${res.status}`);
  return data as T;
}

const get = <T>(p: string) => req<T>(p, "GET");
const post = <T>(p: string, b: unknown) => req<T>(p, "POST", b);

export const api = {
  async health(): Promise<{ ok: boolean; hasKey: boolean; hasAuth: boolean }> {
    const res = await fetch("/api/health");
    return res.json();
  },

  // ── auth ──
  async login(email: string, senha: string): Promise<{ token: string; usuario: Usuario }> {
    const out = await post<{ token: string; usuario: Usuario }>("/api/auth/login", { email, senha });
    setToken(out.token);
    return out;
  },
  me: () => get<{ usuario: Usuario }>("/api/me"),
  logout: () => setToken(null),

  // ── carrosséis (biblioteca compartilhada) ──
  listCarousels: () => get<Carousel[]>("/api/carousels"),
  getCarousel: (id: string) => get<Carousel>(`/api/carousels/${id}`),
  async createCarousel(carousel: Carousel): Promise<Carousel> {
    return post<Carousel>("/api/carousels", { carousel: await compressCarouselMedia(carousel) });
  },
  async updateCarousel(carousel: Carousel): Promise<Carousel> {
    return req<Carousel>(`/api/carousels/${carousel.id}`, "PUT", { carousel: await compressCarouselMedia(carousel) });
  },
  setStatus: (id: string, status: string) => req<{ ok: boolean }>(`/api/carousels/${id}/status`, "PATCH", { status }),
  deleteCarousel: (id: string) => req<{ ok: boolean }>(`/api/carousels/${id}`, "DELETE"),

  // ── templates ──
  listTemplates: () => get<Template[]>("/api/templates"),
  async createTemplate(template: Template): Promise<Template> {
    return post<Template>("/api/templates", { template: await compressTemplateMedia(template) });
  },
  deleteTemplate: (id: string) => req<{ ok: boolean }>(`/api/templates/${id}`, "DELETE"),

  // ── coleções (clientes) ──
  listCollections: () => get<Collection[]>("/api/collections"),
  createCollection: (c: Collection) => post<Collection>("/api/collections", c),
  updateCollection: (id: string, b: { name?: string; color?: string; brief?: string | null }) => req<Collection>(`/api/collections/${id}`, "PATCH", b),
  deleteCollection: (id: string) => req<{ ok: boolean }>(`/api/collections/${id}`, "DELETE"),

  // ── IA (protegida) ──
  generateCarousel(input: { tema: string; nSlides: number; modelo: AiModelo; marca?: BrandVoice; idioma?: string }) {
    return post<AiCarousel>("/api/generate/carousel", input);
  },
  generateImage(input: { prompt: string; refImageBase64?: string; refMime?: string; refs?: { data: string; mime: string }[]; contexto?: string; fast?: boolean }) {
    return post<{ dataUrl: string; model: string }>("/api/generate/image", input);
  },
  refineSlide(input: { texto: string; instrucao: string; marca?: BrandVoice }) {
    return post<{ texto: string }>("/api/generate/refine", input);
  },
  generateCaption(input: { tema?: string; slides?: AiSlide[]; marca?: BrandVoice }) {
    return post<{ legenda: string }>("/api/generate/caption", input);
  },
  async trends(q: string, period = "semana", limit = 8) {
    const data = await get<{ items: TrendItem[] }>(`/api/generate/trends?q=${encodeURIComponent(q)}&period=${period}&limit=${limit}`);
    return data.items;
  },
  dailyTrends: () => get<{ date: string; items: TrendItem[] }>("/api/generate/trends/daily"),

  // ── acessos / equipe (só conta dona) ──
  listEquipe: () => get<AcessoUser[]>("/api/equipe"),
  criarAcesso: (b: { nome: string; email: string; senha: string; papel: string }) => post<AcessoUser>("/api/equipe", b),
  editarAcesso: (id: number, b: { nome?: string; papel?: string; ativo?: number }) => req<AcessoUser>(`/api/equipe/${id}`, "PATCH", b),
  resetarSenha: (id: number, senha: string) => post<{ ok: boolean }>(`/api/equipe/${id}/senha`, { senha }),
  removerAcesso: (id: number) => req<{ ok: boolean }>(`/api/equipe/${id}`, "DELETE"),
};

export interface TrendItem { titulo: string; categoria?: string; fonte: string; quando: string; resumo: string }
export interface AcessoUser { id: number; nome: string; email: string; papel: string; ativo: number; dono: number; criadoEm?: number | string | null }

// tipos auxiliares reexportados p/ quem importa daqui
export type { BrandKit, Slide };
