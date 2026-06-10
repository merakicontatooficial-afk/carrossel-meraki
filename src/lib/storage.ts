import type { BrandKit, Carousel, Collection, Template } from "../types";

// Persistência local por usuário — sem backend.
const KEYS = {
  carousels: "cg.carousels.v1",
  templates: "cg.templates.v1",
  collections: "cg.collections.v1",
  kits: "cg.kits.v1",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    alert(
      "Não foi possível salvar: armazenamento local cheio. Remova carrosséis antigos ou use imagens menores."
    );
    return false;
  }
}

export const storage = {
  loadCarousels: () => load<Carousel[]>(KEYS.carousels, []),
  saveCarousels: (v: Carousel[]) => save(KEYS.carousels, v),
  upsertCarousel(c: Carousel) {
    const all = storage.loadCarousels();
    const i = all.findIndex((x) => x.id === c.id);
    if (i >= 0) all[i] = c;
    else all.unshift(c);
    return save(KEYS.carousels, all);
  },
  deleteCarousel(id: string) {
    save(
      KEYS.carousels,
      storage.loadCarousels().filter((c) => c.id !== id)
    );
  },

  loadTemplates: () => load<Template[]>(KEYS.templates, []),
  saveTemplates: (v: Template[]) => save(KEYS.templates, v),
  upsertTemplate(t: Template) {
    const all = storage.loadTemplates();
    const i = all.findIndex((x) => x.id === t.id);
    if (i >= 0) all[i] = t;
    else all.unshift(t);
    return save(KEYS.templates, all);
  },
  deleteTemplate(id: string) {
    save(
      KEYS.templates,
      storage.loadTemplates().filter((t) => t.id !== id)
    );
  },

  loadCollections: () => load<Collection[]>(KEYS.collections, []),
  saveCollections: (v: Collection[]) => save(KEYS.collections, v),

  loadCustomKits: () => load<BrandKit[]>(KEYS.kits, []),
  saveCustomKits: (v: BrandKit[]) => save(KEYS.kits, v),
};
