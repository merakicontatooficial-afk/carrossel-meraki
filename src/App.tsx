import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, CarouselCounter, Collection, Slide, Template } from "./types";
import { uid } from "./types";
import { getKit, makeCarouselKit } from "./config/kits";
import { storage } from "./lib/storage";
import { cloneSlides } from "./lib/clone";
import Editor from "./components/Editor/Editor";
import { COLLECTION_COLORS } from "./components/Library/Collections";
import Shell from "./components/Shell/Shell";
import type { View } from "./components/Shell/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import { OrganizacaoView, TemplatesView, TrendingsView, ConfigView, Placeholder } from "./components/Shell/Views";
import { Sparkles } from "lucide-react";
import Wizard from "./components/Generate/Wizard";

export default function App() {
  const [carousels, setCarousels] = useState<Carousel[]>(() => storage.loadCarousels());
  const [templates, setTemplates] = useState<Template[]>(() => storage.loadTemplates());
  const [collections, setCollections] = useState<Collection[]>(() => storage.loadCollections());
  const [customKits, setCustomKits] = useState<BrandKit[]>(() => storage.loadCustomKits());
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTema, setWizardTema] = useState("");
  const [wizardMode, setWizardMode] = useState<"ia" | "zero">("ia");

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
      counter: t.counter ? { ...t.counter } : undefined,
      slides: cloneSlides(t.slides),
      updatedAt: Date.now(),
    });
  };

  // criação a partir do wizard de IA: kit + slides já prontos
  const createFromAI = (kit: BrandKit, slides: Slide[], name: string, collectionId?: string, counter?: CarouselCounter) => {
    setCustomKits((all) => [...all, kit]);
    addCarousel({
      id: uid("car"),
      name,
      templateId: "ia",
      kitId: kit.id,
      logo: { src: null, show: true, position: "br", scale: 1, everySlide: true },
      counter,
      slides,
      collectionId,
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

  // REGRA (peso do sistema): apagar carrossel = apagar TODAS as mídias dele.
  // Hoje a mídia (bgImage / element.src em dataURL) vive DENTRO do objeto do
  // carrossel no localStorage — remover o carrossel do array já descarta a mídia
  // no próximo save (nada de store de mídia à parte). Quando a persistência for
  // pro servidor, esta função é o ponto único que também deve apagar os arquivos.
  const deleteCarousel = (id: string) => {
    const target = carousels.find((c) => c.id === id);
    setCarousels((all) => {
      const rest = all.filter((c) => c.id !== id);
      // limpa o kit órfão junto (só se nenhum outro carrossel usa) — evita acúmulo
      if (target && !rest.some((c) => c.kitId === target.kitId)) {
        setCustomKits((ks) => ks.filter((k) => k.id !== target.kitId));
      }
      return rest;
    });
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
        counter: open.counter ? { ...open.counter } : undefined,
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

  const counts: Record<string, number> = {};
  for (const c of carousels) if (c.collectionId) counts[c.collectionId] = (counts[c.collectionId] ?? 0) + 1;

  const q = search.trim().toLowerCase();
  const shownCarousels = q ? carousels.filter((c) => c.name.toLowerCase().includes(q)) : carousels;

  const assignCollection = (carouselId: string, collectionId: string | undefined) =>
    setCarousels((all) => all.map((c) => (c.id === carouselId ? { ...c, collectionId } : c)));

  // "Estúdio" na navegação abre o carrossel mais recente (ou fica na view vazia).
  const navigate = (v: View) => {
    if (v === "estudio" && carousels[0]) {
      setOpenId(carousels[0].id);
      return;
    }
    setView(v);
  };

  return (
    <>
      <Shell
        view={view}
        onNavigate={navigate}
        onGerarIA={() => { setWizardMode("ia"); setWizardTema(""); setWizardOpen(true); }}
        onCriar={() => { setWizardMode("zero"); setWizardTema(""); setWizardOpen(true); }}
        search={search}
        onSearch={setSearch}
      >
        {view === "dashboard" && (
          <Dashboard
            carousels={shownCarousels}
            collections={collections}
            customKits={customKits}
            onGerarIA={() => { setWizardMode("ia"); setWizardTema(""); setWizardOpen(true); }}
            onTemplates={() => setView("templates")}
            onTreinar={() => setView("config")}
            onOpen={setOpenId}
            onDuplicate={duplicateCarousel}
            onDelete={deleteCarousel}
            onAssignCollection={assignCollection}
          />
        )}
        {view === "estudio" && (
          <Placeholder icon={<Sparkles size={22} />} title="Estúdio" note="Gere um carrossel ou abra um existente no Dashboard para editar aqui." />
        )}
        {view === "templates" && (
          <TemplatesView
            templates={templates}
            onClone={createFromTemplate}
            onDelete={(id) => setTemplates((all) => all.filter((t) => t.id !== id))}
          />
        )}
        {view === "trendings" && (
          <TrendingsView
            onCreateFromTrend={(tema) => { setWizardMode("ia"); setWizardTema(tema); setWizardOpen(true); }}
          />
        )}
        {view === "organizacao" && (
          <OrganizacaoView collections={collections} counts={counts} onCreate={createCollection} onDelete={deleteCollection} />
        )}
        {view === "config" && <ConfigView />}
      </Shell>

      {wizardOpen && (
        <Wizard
          collections={collections}
          templates={templates}
          mode={wizardMode}
          initialTema={wizardTema}
          initialStep={wizardTema ? 1 : 0}
          onClose={() => { setWizardOpen(false); setWizardTema(""); }}
          onCreate={(kit, slides, name, collectionId, counter) => {
            createFromAI(kit, slides, name, collectionId, counter);
            setWizardOpen(false);
            setWizardTema("");
          }}
        />
      )}
    </>
  );
}
