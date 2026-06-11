import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, Collection, Slide, Template } from "./types";
import { uid } from "./types";
import { KITS, getKit, makeCarouselKit } from "./config/kits";
import { getStructure, structureDefaultKit } from "./config/structures";
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

  // cada carrossel embute o próprio kit editável (sem "empresa" pré-definida)
  const createCarousel = (structureId: string) => {
    const structure = getStructure(structureId);
    const kit = makeCarouselKit(structureDefaultKit(structureId), structure.name);
    setCustomKits((all) => [...all, kit]);
    addCarousel({
      id: uid("car"),
      name: structure.name,
      templateId: structureId,
      kitId: kit.id,
      logo: { src: null, show: true, position: "br", scale: 1, everySlide: true },
      slides: structure.build(),
      updatedAt: Date.now(),
    });
  };

  const createFromTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    // restaura o look completo do template (kit/logo/moldura)
    const kit: BrandKit = t.kit
      ? { ...t.kit, id: uid("kit") }
      : makeCarouselKit("livre-escuro", t.name);
    setCustomKits((all) => [...all, kit]);
    addCarousel({
      id: uid("car"),
      name: `${t.name} (clone)`,
      templateId: t.framework,
      kitId: kit.id,
      logo: t.logo ? { ...t.logo } : { src: null, show: true, position: "br", scale: 1, everySlide: true },
      frame: t.frame ? { ...t.frame } : undefined,
      slides: cloneSlides(t.slides),
      updatedAt: Date.now(),
    });
  };

  const createContinuous = async (dataUrl: string) => {
    const kit = makeCarouselKit("livre-escuro", "Contínuo");
    setCustomKits((all) => [...all, kit]);
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
      name: "Contínuo",
      templateId: "continuo",
      kitId: kit.id,
      logo: { src: null, show: true, position: "br", scale: 1, everySlide: true },
      slides,
      updatedAt: Date.now(),
    });
  };

  const duplicateCarousel = (id: string) => {
    const src = carousels.find((c) => c.id === id);
    if (!src) return;
    // clona também o kit, pra que editar a cópia não afete o original
    const srcKit = getKit(src.kitId, customKits);
    const kitCopy: BrandKit = { ...srcKit, id: uid("kit") };
    setCustomKits((all) => [...all, kitCopy]);
    setCarousels((all) => [
      {
        ...src,
        id: uid("car"),
        name: `${src.name} (cópia)`,
        kitId: kitCopy.id,
        slides: cloneSlides(src.slides),
        updatedAt: Date.now(),
      },
      ...all,
    ]);
  };

  const deleteCarousel = (id: string) => {
    const target = carousels.find((c) => c.id === id);
    setCarousels((all) => all.filter((c) => c.id !== id));
    // remove o kit órfão (só se nenhum outro carrossel usa)
    if (target) {
      setCarousels((rest) => {
        const stillUsed = rest.some((c) => c.kitId === target.kitId);
        if (!stillUsed) setCustomKits((ks) => ks.filter((k) => k.id !== target.kitId));
        return rest;
      });
    }
  };

  const saveAsTemplate = () => {
    if (!open) return;
    const name = prompt("Nome do template:", open.name);
    if (!name) return;
    const kit = getKit(open.kitId, customKits);
    setTemplates((all) => [
      {
        id: uid("tpl"),
        name,
        framework: open.templateId,
        slides: cloneSlides(open.slides),
        kit: { ...kit, id: uid("kit"), name },
        logo: { ...open.logo },
        frame: open.frame ? { ...open.frame } : undefined,
      },
      ...all,
    ]);
    alert(`Template "${name}" salvo com o design completo. Use "A partir de template" pra clonar.`);
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
      onCreateContinuous={(d) => void createContinuous(d)}
      onDuplicateCarousel={duplicateCarousel}
      onDeleteCarousel={deleteCarousel}
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
