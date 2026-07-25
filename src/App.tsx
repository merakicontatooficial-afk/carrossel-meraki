import { useEffect, useRef, useState } from "react";
import type { BrandKit, Carousel, CarouselCounter, Collection, Slide, Template } from "./types";
import { uid } from "./types";
import { getKit } from "./config/kits";
import { cloneSlides } from "./lib/clone";
import { api, getToken, type Usuario } from "./lib/api";
import Editor from "./components/Editor/Editor";
import { COLLECTION_COLORS } from "./components/Library/Collections";
import Shell from "./components/Shell/Shell";
import type { View } from "./components/Shell/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import { OrganizacaoView, TemplatesView, TrendingsView, ConfigView, Placeholder } from "./components/Shell/Views";
import Login from "./components/Auth/Login";
import { Sparkles, Loader2 } from "lucide-react";
import Wizard from "./components/Generate/Wizard";

/** kit efetivo de um carrossel: embutido (servidor) ou base pelo kitId. */
const resolveKit = (c: Carousel): BrandKit => c.kit ?? getKit(c.kitId);

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [booting, setBooting] = useState(true);

  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTema, setWizardTema] = useState("");
  const [wizardMode, setWizardMode] = useState<"ia" | "zero">("ia");

  // ── boot: valida token e hidrata do servidor ──
  const loadAll = async () => {
    const [cs, ts, cols] = await Promise.all([api.listCarousels(), api.listTemplates(), api.listCollections()]);
    setCarousels(cs);
    setTemplates(ts);
    setCollections(cols);
  };
  useEffect(() => {
    (async () => {
      if (getToken()) {
        try {
          const { usuario } = await api.me();
          setUsuario(usuario);
          await loadAll();
        } catch {
          api.logout();
        }
      }
      setBooting(false);
    })();
  }, []);

  const afterLogin = async (u: Usuario) => {
    setUsuario(u);
    setBooting(true);
    try {
      await loadAll();
    } finally {
      setBooting(false);
    }
  };
  const logout = () => {
    api.logout();
    setUsuario(null);
    setCarousels([]);
    setTemplates([]);
    setOpenId(null);
  };

  const open = carousels.find((c) => c.id === openId) ?? null;

  // ── salvamento (debounce por carrossel) ──
  const timers = useRef<Record<string, number>>({});
  const queueSave = (c: Carousel) => {
    window.clearTimeout(timers.current[c.id]);
    timers.current[c.id] = window.setTimeout(() => {
      api.updateCarousel(c).catch((e) => console.error("save falhou:", e.message));
    }, 500);
  };

  const updateCarousel = (next: Carousel) => {
    next.updatedAt = Date.now();
    if (!next.kit) next.kit = resolveKit(next);
    setCarousels((all) => all.map((c) => (c.id === next.id ? next : c)));
    queueSave(next);
  };

  // cria no servidor e abre no editor
  const addCarousel = async (c: Carousel) => {
    try {
      const saved = await api.createCarousel(c);
      setCarousels((all) => [saved, ...all]);
      setOpenId(saved.id);
    } catch (e) {
      alert("Não foi possível criar: " + (e as Error).message);
    }
  };

  // criação a partir do wizard de IA / do zero
  const createFromAI = (kit: BrandKit, slides: Slide[], name: string, collectionId?: string, counter?: CarouselCounter) => {
    addCarousel({
      id: uid("car"),
      name,
      templateId: "ia",
      kitId: kit.id,
      kit,
      logo: { src: null, show: true, position: "br", scale: 1, everySlide: true },
      counter,
      slides,
      collectionId,
      status: "rascunho",
      updatedAt: Date.now(),
    });
  };

  const createFromTemplate = (templateId: string) => {
    const t = templates.find((x) => x.id === templateId);
    if (!t) return;
    const kit: BrandKit = t.kit ? { ...t.kit, id: uid("kit") } : getKit("livre-escuro");
    addCarousel({
      id: uid("car"),
      name: `${t.name} (clone)`,
      templateId: t.framework,
      kitId: kit.id,
      kit,
      logo: t.logo ? { ...t.logo } : { src: null, show: true, position: "br", scale: 1, everySlide: true },
      frame: t.frame ? { ...t.frame } : undefined,
      counter: t.counter ? { ...t.counter } : undefined,
      slides: cloneSlides(t.slides),
      status: "rascunho",
      updatedAt: Date.now(),
    });
  };

  // "usar como base": clona QUALQUER carrossel da equipe (vira meu, rascunho)
  const useAsBase = (id: string) => {
    const src = carousels.find((c) => c.id === id);
    if (!src) return;
    const kit: BrandKit = { ...resolveKit(src), id: uid("kit") };
    addCarousel({
      ...src,
      id: uid("car"),
      name: `${src.name} (base)`,
      kitId: kit.id,
      kit,
      slides: cloneSlides(src.slides),
      ownerId: undefined,
      ownerName: undefined,
      status: "rascunho",
      updatedAt: Date.now(),
    });
  };

  const deleteCarousel = async (id: string) => {
    setCarousels((all) => all.filter((c) => c.id !== id));
    if (openId === id) setOpenId(null);
    try {
      await api.deleteCarousel(id);
    } catch (e) {
      console.error("delete falhou:", (e as Error).message);
    }
  };

  const setStatus = (id: string, status: Carousel["status"]) => {
    setCarousels((all) => all.map((c) => (c.id === id ? { ...c, status } : c)));
    if (status) api.setStatus(id, status).catch(() => {});
  };

  // ao fechar o editor: recarrega o carrossel do servidor (mídia vira URL, sem dataURL)
  const closeEditor = async () => {
    const id = openId;
    setOpenId(null);
    if (id) {
      try {
        const fresh = await api.getCarousel(id);
        setCarousels((all) => all.map((c) => (c.id === id ? fresh : c)));
      } catch { /* ok */ }
    }
  };

  const saveAsTemplate = async () => {
    if (!open) return;
    const name = prompt("Nome do template:", open.name);
    if (!name) return;
    const kit = resolveKit(open);
    const tpl: Template = {
      id: uid("tpl"),
      name,
      framework: open.templateId,
      slides: cloneSlides(open.slides),
      kit: { ...kit, id: uid("kit"), name },
      logo: { ...open.logo },
      frame: open.frame ? { ...open.frame } : undefined,
      counter: open.counter ? { ...open.counter } : undefined,
    };
    try {
      const saved = await api.createTemplate(tpl);
      setTemplates((all) => [saved, ...all]);
      alert(`Template "${name}" salvo — disponível pra toda a equipe.`);
    } catch (e) {
      alert("Falha ao salvar template: " + (e as Error).message);
    }
  };

  const deleteTemplate = async (id: string) => {
    setTemplates((all) => all.filter((t) => t.id !== id));
    api.deleteTemplate(id).catch(() => {});
  };

  const createCollection = async () => {
    const name = prompt("Nome da coleção (cliente/campanha):");
    if (!name) return;
    const col: Collection = { id: uid("col"), name, color: COLLECTION_COLORS[collections.length % COLLECTION_COLORS.length] };
    try {
      await api.createCollection(col);
      setCollections((all) => [...all, col]);
    } catch (e) {
      alert("Falha ao criar coleção: " + (e as Error).message);
    }
  };

  const deleteCollection = async (id: string) => {
    setCollections((all) => all.filter((c) => c.id !== id));
    setCarousels((all) => all.map((c) => (c.collectionId === id ? { ...c, collectionId: undefined } : c)));
    api.deleteCollection(id).catch(() => {});
  };

  // kit embutido: edições do kit vão para o carrossel aberto (e persistem)
  const updateCustomKit = (kit: BrandKit) => {
    if (open) updateCarousel({ ...open, kit, kitId: kit.id });
  };
  const createCustomKit = (kit: BrandKit) => {
    if (open) updateCarousel({ ...open, kit, kitId: kit.id });
  };

  const assignCollection = (carouselId: string, collectionId: string | undefined) => {
    const c = carousels.find((x) => x.id === carouselId);
    if (c) updateCarousel({ ...c, collectionId });
  };

  // ── render ──
  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-md)]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!usuario) return <Login onLogin={afterLogin} />;

  if (open) {
    return (
      <Editor
        carousel={open}
        kit={resolveKit(open)}
        onChange={updateCarousel}
        onUpdateCustomKit={updateCustomKit}
        onCreateCustomKit={createCustomKit}
        onSaveAsTemplate={saveAsTemplate}
        onBack={closeEditor}
      />
    );
  }

  const counts: Record<string, number> = {};
  for (const c of carousels) if (c.collectionId) counts[c.collectionId] = (counts[c.collectionId] ?? 0) + 1;

  const q = search.trim().toLowerCase();
  const shownCarousels = q ? carousels.filter((c) => c.name.toLowerCase().includes(q)) : carousels;

  const navigate = (v: View) => {
    if (v === "estudio" && carousels[0]) {
      setOpenId(carousels[0].id);
      return;
    }
    setView(v);
  };

  const openWizard = (mode: "ia" | "zero", tema = "") => {
    setWizardMode(mode);
    setWizardTema(tema);
    setWizardOpen(true);
  };

  return (
    <>
      <Shell
        view={view}
        onNavigate={navigate}
        onGerarIA={() => openWizard("ia")}
        onCriar={() => openWizard("zero")}
        userName={usuario.nome}
        onLogout={logout}
        search={search}
        onSearch={setSearch}
      >
        {view === "dashboard" && (
          <Dashboard
            carousels={shownCarousels}
            collections={collections}
            resolveKit={resolveKit}
            currentUserId={usuario.id}
            onGerarIA={() => openWizard("ia")}
            onCriar={() => openWizard("zero")}
            onTemplates={() => setView("templates")}
            onTreinar={() => setView("config")}
            onOpen={setOpenId}
            onUseAsBase={useAsBase}
            onDelete={deleteCarousel}
            onSetStatus={setStatus}
            onAssignCollection={assignCollection}
          />
        )}
        {view === "estudio" && (
          <Placeholder icon={<Sparkles size={22} />} title="Estúdio" note="Gere um carrossel ou abra um existente no Dashboard para editar aqui." />
        )}
        {view === "templates" && (
          <TemplatesView templates={templates} onClone={createFromTemplate} onDelete={deleteTemplate} />
        )}
        {view === "trendings" && <TrendingsView onCreateFromTrend={(tema) => openWizard("ia", tema)} />}
        {view === "organizacao" && (
          <OrganizacaoView collections={collections} counts={counts} onCreate={createCollection} onDelete={deleteCollection} />
        )}
        {view === "config" && <ConfigView isAdmin={usuario.papel === "admin"} />}
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
