import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, Collection, Slide, Template } from "./types";
import { uid } from "./types";
import { KITS, getKit } from "./config/kits";
import { getStructure } from "./config/structures";
import { storage } from "./lib/storage";
import { cloneSlides } from "./lib/clone";
import { sliceWideImage } from "./lib/slice";
import Library from "./components/Library/Library";
import Editor from "./components/Editor/Editor";
import { COLLECTION_COLORS } from "./components/Library/Collections";

export default function App() {
  const [carousels, setCarousels] = useState<Carousel[]>(() => storage.loadCarousels());
  const [templates, setTemplates] = useState<Template[]>(() => storage.loadTemplates());
  const [collections, setCollections] = useState<Collection[]>(() => storage.loadCollections());
  const [customKits, setCustomKits] = useState<BrandKit[]>(() => storage.loadCustomKits());
  const [openId, setOpenId] = useState<string | null>(null);

  const allKits = [...KITS, ...customKits];

  // persistência com debounce (dataURLs podem ser grandes)
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => storage.saveCarousels(carousels), 400);
    return () => window.clearTimeout(saveTimer.current);
  }, [carousels]);
  useEffect(() => {
    storage.saveTemplates(templates);
  }, [templates]);
  useEffect(() => {
    storage.saveCollections(collections);
  }, [collections]);
  useEffect(() => {
    storage.saveCustomKits(customKits);
  }, [customKits]);

  const open = carousels.find((c) => c.id === openId) ?? null;

  const updateCarousel = (next: Carousel) => {
    next.updatedAt = Date.now();
    setCarousels((all) => all.map((c) => (c.id === next.id ? next : c)));
  };

  const addCarousel = (c: Carousel) => {
    setCarousels((all) => [c, ...all]);
    setOpenId(c.id);
  };

  const createCarousel = (structureId: string, kitId: string) => {
    const structure = getStructure(structureId);
    addCarousel({
      id: uid("car"),
      name: `${structure.name} — ${getKit(kitId, customKits).name}`,
      templateId: structureId,
      kitId,
      logo: { src: null, show: true, position: "br" },
      slides: structure.build(),
      updatedAt: Date.now(),
    });
  };

  const createFromTemplate = (templateId: string, kitId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    addCarousel({
      id: uid("car"),
      name: `${t.name} (clone)`,
      templateId: t.framework,
      kitId,
      logo: { src: null, show: true, position: "br" },
      slides: cloneSlides(t.slides),
      updatedAt: Date.now(),
    });
  };

  const createContinuous = async (dataUrl: string, kitId: string) => {
    const kit = getKit(kitId, customKits);
    const slices = await sliceWideImage(dataUrl, kit.bg);
    const slides: Slide[] = slices.map((bgImage) => ({
      id: uid("sl"),
      kind: "value",
      elements: [],
      bg: "bg",
      bgImage,
      colors: { locked: true },
    }));
    addCarousel({
      id: uid("car"),
      name: `Contínuo — ${kit.name}`,
      templateId: "continuo",
      kitId,
      logo: { src: null, show: true, position: "br" },
      slides,
      updatedAt: Date.now(),
    });
  };

  const duplicateCarousel = (id: string) => {
    const src = carousels.find((c) => c.id === id);
    if (!src) return;
    setCarousels((all) => [
      { ...src, id: uid("car"), name: `${src.name} (cópia)`, slides: cloneSlides(src.slides), updatedAt: Date.now() },
      ...all,
    ]);
  };

  const saveAsTemplate = () => {
    if (!open) return;
    const name = prompt("Nome do template:", open.name);
    if (!name) return;
    setTemplates((all) => [
      { id: uid("tpl"), name, framework: open.templateId, slides: cloneSlides(open.slides) },
      ...all,
    ]);
    alert(`Template "${name}" salvo. Use "A partir de template" na biblioteca pra clonar.`);
  };

  const createCollection = () => {
    const name = prompt("Nome da coleção (cliente/campanha):");
    if (!name) return;
    setCollections((all) => [...all, { id: uid("col"), name, color: COLLECTION_COLORS[all.length % COLLECTION_COLORS.length] }]);
  };

  const duplicateCollection = (id: string) => {
    const src = collections.find((c) => c.id === id);
    if (!src) return;
    const copy: Collection = { id: uid("col"), name: `${src.name} (cópia)`, color: src.color };
    setCollections((all) => [...all, copy]);
    // duplica também os carrosséis da coleção
    setCarousels((all) => [
      ...all
        .filter((c) => c.collectionId === id)
        .map((c) => ({
          ...c,
          id: uid("car"),
          name: `${c.name} (cópia)`,
          slides: cloneSlides(c.slides),
          collectionId: copy.id,
          updatedAt: Date.now(),
        })),
      ...all,
    ]);
  };

  const deleteCollection = (id: string) => {
    setCollections((all) => all.filter((c) => c.id !== id));
    setCarousels((all) => all.map((c) => (c.collectionId === id ? { ...c, collectionId: undefined } : c)));
  };

  // kits custom
  const updateCustomKit = (kit: BrandKit) => {
    setCustomKits((all) => all.map((k) => (k.id === kit.id ? kit : k)));
  };
  const createCustomKit = (kit: BrandKit) => {
    setCustomKits((all) => [...all, kit]);
    if (open) updateCarousel({ ...open, kitId: kit.id });
  };

  if (open) {
    return (
      <Editor
        carousel={open}
        kit={getKit(open.kitId, customKits)}
        kits={allKits}
        onChange={updateCarousel}
        onUpdateCustomKit={updateCustomKit}
        onCreateCustomKit={createCustomKit}
        onSaveAsTemplate={saveAsTemplate}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <Library
      carousels={carousels}
      templates={templates}
      collections={collections}
      kits={allKits}
      customKits={customKits}
      onOpen={setOpenId}
      onCreate={createCarousel}
      onCreateFromTemplate={createFromTemplate}
      onCreateContinuous={(d, k) => void createContinuous(d, k)}
      onDuplicateCarousel={duplicateCarousel}
      onDeleteCarousel={(id) => setCarousels((all) => all.filter((c) => c.id !== id))}
      onAssignCollection={(carouselId, collectionId) =>
        setCarousels((all) => all.map((c) => (c.id === carouselId ? { ...c, collectionId } : c)))
      }
      onCreateCollection={createCollection}
      onDuplicateCollection={duplicateCollection}
      onDeleteCollection={deleteCollection}
      onDeleteTemplate={(id) => setTemplates((all) => all.filter((t) => t.id !== id))}
    />
  );
}
