import { useState } from "react";
import type { BrandIdentity, BrandKit, CarouselCounter, Collection, Slide, Template } from "../../types";
import { api, type AiCarousel, type AiModelo, type BrandVoice } from "../../lib/api";
import { aiToSlides, modeloKit, modeloCounter, applyAlternating } from "../../lib/aiCarousel";
import { KITS, kitToIdentity } from "../../config/kits";
import { FONT_PAIRS, FONT_PAIR_AUTO } from "../../config/fontPairs";
import { parseMdCarousel, mdImageSlides, type MdDoc } from "../../lib/mdCarousel";
import { Field, Select, ColorInput, FileButton } from "../ui";
import { LayoutGrid, PenLine, Layers, ImageIcon, Type, Wand2, X, ArrowLeft, ArrowRight, Loader2, Check, Newspaper, Palette, FileCode, Upload, AlertTriangle, Copy } from "lucide-react";

interface Props {
  collections: Collection[];
  templates: Template[];
  initialTema?: string;
  initialStep?: number;
  mode?: "ia" | "zero"; // "zero" = criar do zero (sem tema gerado por IA)
  onClose: () => void;
  onCreate: (kit: BrandKit, slides: Slide[], name: string, collectionId?: string, counter?: CarouselCounter) => void;
}

const STEPS = [
  { icon: <LayoutGrid size={18} />, title: "Formato do Post", sub: "Qual é o formato do seu conteúdo?" },
  { icon: <PenLine size={18} />, title: "Conteúdo", sub: "Sobre o que é o carrossel e como gerá-lo" },
  { icon: <Layers size={18} />, title: "Estilo Visual", sub: "Como você quer que seus slides apareçam?" },
  { icon: <ImageIcon size={18} />, title: "Imagens", sub: "Modo de imagens e referências visuais" },
  { icon: <Type size={18} />, title: "Tipografia", sub: "Fontes e handle do Instagram" },
  { icon: <Wand2 size={18} />, title: "ID Visual + Template", sub: "Cores da marca e template de design" },
];

const MODELOS: { id: AiModelo; nome: string; desc: string; preview: "min" | "prof" | "cre" | "tech" }[] = [
  { id: "minimalista", nome: "Minimalista", desc: "Foto de fundo com overlay e texto. Impacto visual imediato.", preview: "min" },
  { id: "profile", nome: "Profile", desc: "Visual de tweet com foto de perfil. Autoridade e leveza.", preview: "prof" },
  { id: "creators", nome: "Creators", desc: "Texto em gradiente com barras de progresso. Moderno e claro.", preview: "cre" },
  { id: "techviral", nome: "TechViral", desc: "Títulos com marca-texto e cards. Ideal para tech, IA e notícias.", preview: "tech" },
];

const IMG_MODES = [
  { id: "sem", label: "Sem imagens", on: true },
  { id: "cartao", label: "Cartão de imagem", on: true },
  { id: "fundo", label: "Imagem de fundo", on: true },
] as const;

// mini mockup por modelo (pro card de Estilo Visual)
function Mock({ kind }: { kind: "min" | "prof" | "cre" | "tech" }) {
  const bar = (w: string, c = "rgba(255,255,255,.35)") => <div style={{ height: 5, width: w, borderRadius: 3, background: c }} />;
  const base = "flex h-full w-full flex-col justify-end gap-1.5 rounded-lg p-2";
  if (kind === "min") return <div className={base} style={{ background: "linear-gradient(180deg,#3a3350,#0c0c10)" }}>{bar("40%", "#7c5cff")}{bar("80%", "#fff")}{bar("55%")}</div>;
  if (kind === "prof") return <div className={base + " justify-start"} style={{ background: "#101014" }}><div className="flex items-center gap-1"><span style={{ width: 10, height: 10, borderRadius: 999, background: "#5103c1" }} />{bar("40%", "#fff")}</div>{bar("85%")}{bar("70%")}<div className="mt-1 h-6 rounded" style={{ background: "rgba(255,255,255,.08)" }} /></div>;
  if (kind === "cre") return <div className={base} style={{ background: "#f4efe6" }}>{bar("50%", "#e0397e")}{bar("80%", "#1a1424")}{bar("60%", "#8a8390")}</div>;
  return <div className={base} style={{ background: "#efe9fb" }}><span className="rounded px-1 py-0.5 text-[6px]" style={{ background: "#6d28d9", color: "#fff", width: "fit-content" }}>TAG</span>{bar("85%", "#1a1226")}{bar("60%", "#6d28d9")}</div>;
}

export default function Wizard({ collections, templates, initialTema, initialStep, mode = "ia", onClose, onCreate }: Props) {
  const zero = mode === "zero";
  const [step, setStep] = useState(initialStep ?? 0);
  const [tema, setTema] = useState(initialTema ?? "");
  const [collectionId, setCollectionId] = useState("");
  // origem do conteúdo: auto (IA escreve / em branco no modo zero), exato (texto colado), md (roteiro pronto)
  const [fonte, setFonte] = useState<"auto" | "exato" | "md">("auto");
  const [mdText, setMdText] = useState("");
  const [mdDoc, setMdDoc] = useState<MdDoc | null>(null);
  const [idioma, setIdioma] = useState("pt-BR");
  const [nSlides, setNSlides] = useState(5);
  const [modelo, setModelo] = useState<AiModelo>("minimalista");
  const [imgMode, setImgMode] = useState<string>("cartao");
  const [gerarIA, setGerarIA] = useState(false);
  const [estiloImg, setEstiloImg] = useState("");
  const [refImage, setRefImage] = useState<string | null>(null);
  const [slidesComImagem, setSlidesComImagem] = useState<number[]>([1]);
  const [handle, setHandle] = useState("");
  const [fontPair, setFontPair] = useState(FONT_PAIR_AUTO);
  const [identityId, setIdentityId] = useState(""); // "" = cores manuais
  const [templateId, setTemplateId] = useState("");
  const [cFundo, setCFundo] = useState("#0A0A0B");
  const [cTitulo, setCTitulo] = useState("#FFFFFF");
  const [cSub, setCSub] = useState("#A8A8A8");
  const [cAccent, setCAccent] = useState("#7C5CFF");
  const [alternarCores, setAlternarCores] = useState(false);
  const [cFundo2, setCFundo2] = useState("#5103c1");
  const [busy, setBusy] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [trends, setTrends] = useState<{ titulo: string }[] | null>(null);

  const cliente = collections.find((c) => c.id === collectionId);
  const clienteNome = cliente?.name;
  const brandName = handle.replace(/^@/, "").trim() || clienteNome || "";

  // ── identidade visual (cores salvas em Organização, ou um kit do app) ──
  const identityOptions = [
    { value: "", label: "— Cores manuais —" },
    ...collections.filter((c) => c.identity).map((c) => ({ value: `col:${c.id}`, label: `${c.name} · salva` })),
    ...KITS.map((k) => ({ value: `kit:${k.id}`, label: `Kit ${k.name}` })),
  ];

  const findIdentity = (v: string): BrandIdentity | null => {
    if (v.startsWith("col:")) return collections.find((c) => c.id === v.slice(4))?.identity ?? null;
    if (v.startsWith("kit:")) {
      const k = KITS.find((x) => x.id === v.slice(4));
      return k ? kitToIdentity(k) : null;
    }
    return null;
  };

  /** Preenche os campos do wizard com uma identidade salva. */
  const applyIdentity = (v: string) => {
    setIdentityId(v);
    const idv = findIdentity(v);
    if (!idv) return;
    setCFundo(idv.bg);
    setCTitulo(idv.text);
    setCSub(idv.muted);
    setCAccent(idv.accent);
    if (idv.bgAlt) setCFundo2(idv.bgAlt);
    if (idv.fontPair && FONT_PAIRS[idv.fontPair]) setFontPair(idv.fontPair);
    if (idv.handle) setHandle(idv.handle);
  };

  // escolher o cliente já traz a identidade dele (se tiver uma salva)
  const escolherCliente = (id: string) => {
    setCollectionId(id);
    const col = collections.find((c) => c.id === id);
    if (col?.identity) applyIdentity(`col:${id}`);
  };

  // mexeu numa cor na mão → deixa de ser "a identidade salva"
  const manual = (setter: (v: string) => void) => (v: string) => { setter(v); setIdentityId(""); };

  /**
   * Lê o roteiro .md e já configura o wizard com o que o arquivo declarou
   * (cliente, modelo, imagens, nº de slides). O usuário ainda pode ajustar tudo.
   */
  const carregarMd = (texto: string) => {
    setMdText(texto);
    setErro(null);
    if (!texto.trim()) { setMdDoc(null); return; }
    const doc = parseMdCarousel(texto);
    setMdDoc(doc);
    if (!doc.slides.length) return;

    setFonte("md");
    setNSlides(doc.slides.length);
    if (doc.modelo) setModelo(doc.modelo);
    if (doc.imagens) setImgMode(doc.imagens);
    if (doc.handle) setHandle(doc.handle);

    // cliente do .md → coleção com o mesmo nome (voz + identidade visual)
    const alvo = (doc.cliente ?? "").trim().toLowerCase();
    const col = alvo ? collections.find((c) => c.name.trim().toLowerCase() === alvo) : undefined;
    if (col) escolherCliente(col.id);

    // identidade explícita no .md tem prioridade sobre a do cliente
    const nomeIdent = (doc.identidade ?? "").trim().toLowerCase();
    if (nomeIdent) {
      const ci = collections.find((c) => c.identity && c.name.trim().toLowerCase() === nomeIdent);
      const ki = KITS.find((k) => k.name.trim().toLowerCase() === nomeIdent || k.id === nomeIdent);
      if (ci) applyIdentity(`col:${ci.id}`);
      else if (ki) applyIdentity(`kit:${ki.id}`);
    }

    const comImagem = mdImageSlides(doc);
    if (comImagem.length) setSlidesComImagem(comImagem);
  };

  const lerArquivoMd = (dataUrl: string) => {
    try {
      const b64 = dataUrl.split(",")[1] ?? "";
      carregarMd(new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))));
    } catch {
      setErro("Não consegui ler esse arquivo. Salve como .md em UTF-8 e tente de novo.");
    }
  };

  const buscarNoticias = async () => {
    if (!tema.trim()) return;
    setBusy("Buscando notícias…");
    setErro(null);
    try {
      const items = await api.trends(tema, "semana", 5);
      setTrends(items.map((i) => ({ titulo: i.titulo })));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  // divide o texto colado em N slides (modo "conteúdo exato" — sem IA)
  const splitExato = (text: string, n: number): AiCarousel => {
    const blocks = text.split(/\n\s*\n|\n/).map((s) => s.trim()).filter(Boolean);
    const per = Math.max(1, Math.ceil(blocks.length / n));
    const groups: string[][] = [];
    for (let i = 0; i < blocks.length; i += per) groups.push(blocks.slice(i, i + per));
    const slides = groups.slice(0, n).map((g, i) => ({
      kind: (i === 0 ? "cover" : "value") as AiCarousel["slides"][number]["kind"],
      headline: g[0] ?? "",
      body: g.slice(1).join("\n") || undefined,
    }));
    return { slides };
  };

  const gerar = async () => {
    setErro(null);
    try {
      // a voz do cliente = nome + DOSSIÊ (.md cadastrado em Organização)
      const marca: BrandVoice | undefined = clienteNome ? { nome: clienteNome, brief: cliente?.brief ?? undefined } : undefined;

      let ai: AiCarousel;
      if (fonte === "md" && mdDoc?.slides.length) {
        // roteiro pronto: os textos do .md entram como estão (com a marcação de destaque)
        ai = { slides: mdDoc.slides.map(({ kind, eyebrow, headline, body }) => ({ kind, eyebrow, headline, body })) };
      } else if (zero) {
        // criar do zero: slides em branco (textos-placeholder p/ editar no editor)
        ai = {
          slides: Array.from({ length: nSlides }, (_, i) => ({
            kind: (i === 0 ? "cover" : "value") as AiCarousel["slides"][number]["kind"],
            headline: i === 0 ? "Título da capa" : "Título do slide",
            body: "Toque para editar este texto.",
          })),
        };
      } else if (fonte === "exato") {
        ai = splitExato(tema, nSlides);
      } else {
        setBusy("Pesquisando e escrevendo o carrossel…");
        ai = await api.generateCarousel({ tema, nSlides, modelo, marca, idioma });
      }

      // quais slides terão imagem (só se o modo não for "sem imagens")
      const imageSlides = imgMode === "sem" ? [] : slidesComImagem.filter((n) => n >= 1 && n <= ai.slides.length);

      const name =
        (fonte === "md" ? mdDoc?.titulo?.slice(0, 60) : "") ||
        (zero ? "" : tema.slice(0, 40)) ||
        (clienteNome ? `${clienteNome} · Novo carrossel` : "Novo carrossel");
      const kit = modeloKit(modelo, cAccent, clienteNome ? `${clienteNome} · ${name}` : name, brandName || undefined);
      // template salvo tem prioridade de look
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl?.kit) Object.assign(kit, { ...tpl.kit, id: kit.id, name: kit.name, logo: kit.logo });
      // cores manuais
      kit.bg = cFundo; kit.text = cTitulo; kit.muted = cSub; kit.accent = cAccent;
      // combinação de fontes (sobrepõe o padrão do modelo)
      const fp = FONT_PAIRS[fontPair];
      if (fp?.display) kit.fontDisplay = fp.display;
      if (fp?.body) { kit.fontBody = fp.body; kit.fontLabel = fp.body; }

      const slides = aiToSlides(ai, modelo, { imageSlides, brandName, imgKind: imgMode === "fundo" ? "fundo" : "cartao" });

      // cores alternadas entre slides (estilo MyPostFlow)
      if (alternarCores) applyAlternating(slides, cFundo2, cAccent);

      // gera e COLOCA a imagem em cada slide marcado — já vai configurado pro editor.
      // Profile → preenche o retângulo de mídia (maior slot vazio); demais → foto de fundo.
      if (gerarIA && imageSlides.length) {
        const refB64 = refImage ? refImage.split(",")[1] : undefined;
        for (let k = 0; k < imageSlides.length; k++) {
          const idx = imageSlides[k];
          setBusy(`Gerando imagem ${k + 1} de ${imageSlides.length}…`);
          try {
            const ctx = ai.slides[idx - 1]?.headline ?? tema;
            // descrição vinda do .md manda; o "estilo das imagens" entra como complemento
            const descMd = fonte === "md" ? (mdDoc?.slides[idx - 1]?.imagem ?? "").trim() : "";
            const prompt = [descMd || `Cena fotográfica que ilustra: ${ctx}`, estiloImg.trim()].filter(Boolean).join(" · ");
            const img = await api.generateImage({
              prompt,
              refImageBase64: refB64,
              contexto: [clienteNome, fonte === "md" ? mdDoc?.titulo : tema, ctx].filter(Boolean).join(" · "),
            });
            const target = slides[idx - 1];
            // maior slot de imagem vazio (evita cair no avatar do Profile)
            const imgEl = target.elements
              .filter((e) => e.type === "image" && !e.src)
              .sort((a, b) => b.w * b.h - a.w * a.h)[0];
            if (imgEl) {
              imgEl.src = img.dataUrl;
            } else {
              target.bgImage = img.dataUrl;
              target.bgScale = 1;
            }
          } catch (e) {
            setErro("Uma imagem falhou (o resto foi gerado): " + (e as Error).message);
          }
        }
      }

      onCreate(kit, slides, name, collectionId || undefined, modeloCounter(modelo));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const canNext =
    step !== 1 ? true
      : fonte === "md" ? !!mdDoc?.slides.length
        : zero ? true
          : tema.trim().length > 2;
  const last = step === 5;
  const cur =
    step === 1 && fonte === "md"
      ? { ...STEPS[1], title: "Conteúdo · roteiro .md", sub: "Suba o .md do Claude — ele define textos, destaques e nº de slides" }
      : zero && step === 1
        ? { ...STEPS[1], title: "Do que é o carrossel", sub: "Defina cliente e nº de slides — os textos você escreve no editor" }
        : STEPS[step];

  const card = "rounded-2xl border p-4 text-left transition";
  const chip = (active: boolean) =>
    `flex h-11 w-11 items-center justify-center rounded-xl text-sm font-semibold transition ${active ? "bg-[var(--brand-sat)] text-white" : "bg-white/5 text-[var(--text-md)] hover:text-white"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div className="glass flex max-h-[92vh] w-full max-w-xl flex-col !rounded-[26px]" onClick={(e) => e.stopPropagation()}>
        {/* header */}
        <div className="flex items-center gap-3 px-6 pt-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-sat)]/25 text-[var(--brand-hi)]">{cur.icon}</div>
          <div className="mr-auto">
            <h2 className="text-base font-semibold text-white">{cur.title}</h2>
            <p className="text-xs text-[var(--text-md)]">{cur.sub}</p>
          </div>
          <button onClick={onClose} className="text-[var(--text-lo)] hover:text-white"><X size={18} /></button>
        </div>
        {/* progress */}
        <div className="px-6 pb-1 pt-4">
          <div className="flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-[var(--brand-sat)] transition-all" style={{ width: `${((step + 1) / 6) * 100}%` }} />
            </div>
            <span className="text-[11px] text-[var(--text-lo)]">{step + 1} / 6</span>
          </div>
        </div>

        {/* body */}
        <div className="min-h-[300px] flex-1 overflow-y-auto px-6 py-5">
          {/* 1 · Formato */}
          {step === 0 && (
            <div className="space-y-3">
              {[
                { id: "carrossel", n: "Carrossel", d: "4:5 · 1080 × 1350 px", h: "Ideal para conteúdo educativo e listas", on: true },
                { id: "quadrado", n: "Quadrado", d: "1:1 · 1080 × 1080 px", h: "Ótimo para quotes e imagens simples", on: false },
                { id: "stories", n: "Stories", d: "9:16 · 1080 × 1920 px", h: "Perfeito para stories e reels verticais", on: false },
              ].map((f) => (
                <div key={f.id} className={`${card} flex items-center gap-4 ${f.on ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/12" : "border-white/10 opacity-50"}`}>
                  <div className="h-11 w-11 rounded-lg bg-[var(--brand-sat)]/30" />
                  <div className="mr-auto">
                    <div className="text-sm font-semibold text-white">{f.n} {!f.on && <span className="text-[10px] text-[var(--text-lo)]">· em breve</span>}</div>
                    <div className="text-[11px] text-[var(--text-lo)]">{f.d}</div>
                    <div className="text-[11px] text-[var(--text-md)]">{f.h}</div>
                  </div>
                  {f.on && <Check size={18} className="text-[var(--brand-hi)]" />}
                </div>
              ))}
            </div>
          )}

          {/* 2 · Conteúdo */}
          {step === 1 && (
            <div className="space-y-4">
              {/* origem do conteúdo — vale tanto pra "Gerar com IA" quanto pra "Criar do zero" */}
              <div>
                <div className="mb-1.5 text-xs text-[var(--text-md)]">De onde vem o conteúdo?</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "auto" as const, label: zero ? "Em branco" : "IA escreve", desc: zero ? "Você escreve no editor" : "A partir do tema" },
                    { id: "exato" as const, label: "Texto exato", desc: "Cola e distribui" },
                    { id: "md" as const, label: "Roteiro .md", desc: "Vindo do Claude" },
                  ].map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setFonte(o.id)}
                      className={`rounded-lg border px-2.5 py-2 text-left transition ${fonte === o.id ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/15" : "border-white/10 hover:border-white/25"}`}
                    >
                      <div className="text-[12px] font-semibold text-white">{o.label}</div>
                      <div className="text-[10px] leading-tight text-[var(--text-lo)]">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* roteiro .md — o arquivo manda no conteúdo e já configura o wizard */}
              {fonte === "md" && (
                <div className="rounded-xl border border-white/10 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <FileCode size={14} className="text-[var(--brand-hi)]" />
                    <span className="mr-auto text-[12px] font-semibold text-white">Roteiro pronto (.md)</span>
                    <FileButton label={<><Upload size={13} /> Subir .md</>} accept=".md,.markdown,.txt" onFile={lerArquivoMd} />
                  </div>
                  <textarea
                    value={mdText}
                    onChange={(e) => carregarMd(e.target.value)}
                    rows={6}
                    placeholder={"Cole aqui o .md gerado pelo Claude (skill carrossel-meraki)…\n\n## capa\n# O erro que ==trava== seu delivery\n\n## valor\ntag: ERRO 1\n# Foto ruim *mata* o pedido\nO cliente decide em 3 segundos."}
                    className="w-full resize-y rounded-lg border border-white/10 bg-white/5 p-3 font-mono text-[11.5px] leading-relaxed text-white outline-none focus:border-[var(--glass-brd-h)]"
                  />
                  {mdDoc && mdDoc.slides.length > 0 && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--brand-hi)]">
                        <span className="flex items-center gap-1"><Check size={12} /> {mdDoc.slides.length} slides lidos</span>
                        {mdDoc.cliente && <span className="text-[var(--text-md)]">cliente: {mdDoc.cliente}</span>}
                        {mdDoc.modelo && <span className="text-[var(--text-md)]">modelo: {mdDoc.modelo}</span>}
                        {mdImageSlides(mdDoc).length > 0 && <span className="text-[var(--text-md)]">imagem em: {mdImageSlides(mdDoc).join(", ")}</span>}
                      </div>
                      <ol className="max-h-32 space-y-0.5 overflow-y-auto text-[11px] text-[var(--text-md)]">
                        {mdDoc.slides.map((s, i) => (
                          <li key={i} className="truncate">
                            <span className="text-[var(--text-lo)]">{i + 1}. [{s.kind}]</span> {s.headline}
                          </li>
                        ))}
                      </ol>
                      {mdDoc.avisos.length > 0 && (
                        <div className="space-y-0.5 rounded-lg bg-amber-500/10 px-2.5 py-2">
                          {mdDoc.avisos.map((a, i) => (
                            <p key={i} className="flex gap-1.5 text-[11px] leading-snug text-amber-200/90"><AlertTriangle size={12} className="mt-0.5 shrink-0" /> {a}</p>
                          ))}
                        </div>
                      )}
                      {mdDoc.legenda && (
                        <button
                          className="btn !min-h-0 w-full !py-1.5 text-[11px]"
                          onClick={() => { navigator.clipboard.writeText(mdDoc.legenda!); setErro("Legenda copiada para a área de transferência."); }}
                        >
                          <Copy size={12} /> Copiar a legenda do .md
                        </button>
                      )}
                    </div>
                  )}
                  {mdText.trim() && mdDoc && mdDoc.slides.length === 0 && (
                    <p className="mt-2 text-[11px] text-red-300">Não encontrei slides nesse arquivo. Use `## capa`, `## valor`, `## cta` como títulos de slide.</p>
                  )}
                </div>
              )}

              {fonte === "auto" && zero && (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[12px] leading-relaxed text-[var(--text-md)]">
                  Modo <b className="text-white">Criar do zero</b>: o carrossel abre com os textos em branco pra você escrever no editor. Todas as demais configurações (modelo, imagens, cores, tipografia) continuam disponíveis.
                </p>
              )}

              {fonte !== "md" && !(zero && fonte === "auto") && (
                <>
                  <Field label={fonte === "exato" ? "Cole o texto que vai nos slides" : "Sobre o que é o conteúdo?"}>
                    <textarea autoFocus value={tema} onChange={(e) => setTema(e.target.value)} rows={fonte === "exato" ? 6 : 3} placeholder={fonte === "exato" ? "Cada linha/parágrafo vira um pedaço do carrossel — o texto não é reescrito." : "Ex.: 5 erros que travam o crescimento de um restaurante no Instagram"} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]" />
                  </Field>
                  {fonte === "auto" && (
                    <div>
                      <button className="btn w-full" onClick={buscarNoticias} disabled={!!busy || !tema.trim()}><Newspaper size={15} /> Buscar notícias recentes sobre o tema</button>
                      {trends && (
                        <div className="mt-2 space-y-1">
                          {trends.length === 0 && <p className="text-[11px] text-[var(--text-lo)]">Nada encontrado.</p>}
                          {trends.map((t, i) => (
                            <button key={i} onClick={() => { setTema(t.titulo); setTrends(null); }} className="block w-full rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-left text-xs text-[var(--text-md)] hover:text-white">{t.titulo}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {fonte === "auto" && (
                    <Field label="Idioma do conteúdo">
                      <Select value={idioma} onChange={setIdioma} options={[{ value: "pt-BR", label: "Português (BR)" }, { value: "en", label: "English" }, { value: "es", label: "Español" }]} />
                    </Field>
                  )}
                </>
              )}
              <Field label="Cliente / marca (opcional — define a voz e as cores)">
                <Select value={collectionId} onChange={escolherCliente} options={[{ value: "", label: "— Voz padrão da Meraki —" }, ...collections.map((c) => ({ value: c.id, label: c.name }))]} />
                {cliente?.identity && (
                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--brand-hi)]">
                    <Palette size={12} /> Identidade visual de {cliente.name} aplicada.
                    <span className="flex gap-1">
                      {[cliente.identity.bg, cliente.identity.text, cliente.identity.muted, cliente.identity.accent].map((cor, i) => (
                        <span key={i} className="h-3 w-3 rounded-full border border-white/20" style={{ background: cor }} />
                      ))}
                    </span>
                  </p>
                )}
              </Field>
              <div>
                <div className="mb-1.5 text-xs text-[var(--text-md)]">Número de slides</div>
                {fonte === "md" ? (
                  <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] text-[var(--text-md)]">
                    Definido pelo roteiro: <b className="text-white">{nSlides} slides</b>. Pra mudar, edite o .md.
                  </p>
                ) : (
                  <div className="grid grid-cols-10 gap-1.5">
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                      <button key={n} onClick={() => setNSlides(n)} className={chip(n === nSlides)}>{n}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3 · Estilo Visual */}
          {step === 2 && (
            <div>
              <div className="grid grid-cols-2 gap-3">
                {MODELOS.map((m) => (
                  <button key={m.id} onClick={() => setModelo(m.id)} className={`${card} ${modelo === m.id ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/12" : "border-white/10 hover:border-white/25"}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="h-14 w-16"><Mock kind={m.preview} /></div>
                      {modelo === m.id && <Check size={16} className="text-[var(--brand-hi)]" />}
                    </div>
                    <div className="text-sm font-semibold text-white">{m.nome}</div>
                    <div className="mt-0.5 text-[11px] leading-snug text-[var(--text-md)]">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4 · Imagens */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 text-xs text-[var(--text-md)]">Imagens no carrossel</div>
                <div className="grid grid-cols-2 gap-2">
                  {IMG_MODES.map((m) => (
                    <button key={m.id} disabled={!m.on} onClick={() => setImgMode(m.id)} className={`rounded-lg border px-3 py-2.5 text-sm ${imgMode === m.id ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/15 text-white" : m.on ? "border-white/10 text-[var(--text-md)] hover:text-white" : "border-white/8 text-[var(--text-lo)] opacity-50"}`}>
                      {m.label}{!m.on && " · em breve"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-lo)]">
                  <b className="text-[var(--text-md)]">Cartão</b>: retângulo de imagem no slide (todos os modelos, inclusive a capa) — é o padrão.
                  <br /><b className="text-[var(--text-md)]">Fundo</b>: foto ocupando o slide inteiro, com o texto por cima.
                </p>
              </div>
              <label className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${gerarIA ? "border-[var(--brand-sat)] bg-[var(--brand-sat)]/12" : "border-white/10"} ${imgMode === "sem" ? "opacity-40" : ""}`}>
                <input type="checkbox" disabled={imgMode === "sem"} checked={gerarIA} onChange={(e) => setGerarIA(e.target.checked)} style={{ accentColor: "var(--brand-sat)" }} />
                <span><span className="text-sm text-white">Gerar imagens com IA</span><br /><span className="text-[11px] text-[var(--text-lo)]">Cria imagens automáticas via Google Gemini (usa saldo)</span></span>
              </label>
              <Field label="Estilo das imagens (opcional)">
                <textarea value={estiloImg} onChange={(e) => setEstiloImg(e.target.value)} rows={2} placeholder="Ex.: Fotografia editorial, tons neutros, sem pessoas…" className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]" />
              </Field>
              <div>
                <div className="mb-1.5 text-xs text-[var(--text-md)]">Imagem de referência — rosto/produto (opcional)</div>
                {refImage ? (
                  <div className="flex items-center gap-3">
                    <img src={refImage} alt="ref" className="h-14 w-14 rounded-lg object-cover" />
                    <button className="btn !min-h-0 !py-2" onClick={() => setRefImage(null)}>Remover</button>
                  </div>
                ) : (
                  <FileButton label={<><ImageIcon size={14} /> Upload de imagem</>} onFile={setRefImage} />
                )}
              </div>
            </div>
          )}

          {/* 5 · Tipografia */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-md)]">Quais slides terão imagem?</span>
                  <button className="text-[11px] text-[var(--brand-hi)]" onClick={() => setSlidesComImagem(slidesComImagem.length === nSlides ? [] : Array.from({ length: nSlides }, (_, i) => i + 1))}>
                    {slidesComImagem.length === nSlides ? "Limpar" : "Selecionar todos"}
                  </button>
                </div>
                {imgMode === "sem" ? (
                  <p className="text-[11px] text-[var(--text-lo)]">Modo "Sem imagens" ativo (passo Imagens). Nenhum slide receberá imagem.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: nSlides }, (_, i) => i + 1).map((n) => {
                      const on = slidesComImagem.includes(n);
                      return (
                        <button key={n} onClick={() => setSlidesComImagem(on ? slidesComImagem.filter((x) => x !== n) : [...slidesComImagem, n])} className={chip(on)}>{n}</button>
                      );
                    })}
                  </div>
                )}
              </div>
              <Field label="@ do Instagram (opcional)">
                <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="@seuperfil" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[var(--glass-brd-h)]" />
                <p className="mt-1 text-[11px] text-[var(--text-lo)]">Aparece na pílula de cada slide.</p>
              </Field>
              <Field label="Combinação de fontes">
                <Select value={fontPair} onChange={setFontPair} options={Object.keys(FONT_PAIRS).map((k) => ({ value: k, label: k }))} />
              </Field>
            </div>
          )}

          {/* 6 · ID Visual + Template */}
          {step === 5 && (
            <div className="space-y-4">
              <Field label="Template salvo (opcional)">
                <Select value={templateId} onChange={setTemplateId} options={[{ value: "", label: "— Não usar template —" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]} />
              </Field>
              <Field label="Identidade visual da marca">
                <Select value={identityId} onChange={applyIdentity} options={identityOptions} />
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-lo)]">
                  As identidades salvas vêm dos clientes cadastrados em <b className="text-[var(--text-md)]">Organização</b>. Escolher uma preenche as cores abaixo; editar uma cor na mão volta pra "manual".
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs text-[var(--text-md)]">Cores</div>
                  <ColorRow label="Fundo" value={cFundo} onChange={manual(setCFundo)} />
                  <ColorRow label="Título" value={cTitulo} onChange={manual(setCTitulo)} />
                  <ColorRow label="Subtítulo" value={cSub} onChange={manual(setCSub)} />
                  <ColorRow label="Destaque" value={cAccent} onChange={manual(setCAccent)} />
                </div>
                {/* preview ao vivo */}
                <div className="flex flex-col justify-end rounded-xl p-4" style={{ background: cFundo, aspectRatio: "4 / 5" }}>
                  <div style={{ fontFamily: "Poppins", fontWeight: 800, fontSize: 22, color: cTitulo, lineHeight: 1.1 }}>Título do <span style={{ color: cAccent }}>post</span></div>
                  <div style={{ fontSize: 12, color: cSub, marginTop: 4 }}>Subtítulo de exemplo</div>
                </div>
              </div>

              {/* alternar cores entre slides (estilo MyPostFlow) */}
              <div className="rounded-xl border border-white/10 p-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input type="checkbox" checked={alternarCores} onChange={(e) => setAlternarCores(e.target.checked)} style={{ accentColor: "var(--brand-sat)" }} />
                  <span className="mr-auto"><span className="text-sm text-white">Alternar cores dos slides</span><br /><span className="text-[11px] text-[var(--text-lo)]">Slides 2, 4, 6… trocam de fundo pra dar ritmo ao carrossel</span></span>
                </label>
                {alternarCores && (
                  <div className="mt-3 flex items-center gap-3">
                    <ColorRow label="Fundo alt." value={cFundo2} onChange={manual(setCFundo2)} />
                    {/* mini preview do ritmo */}
                    <div className="ml-auto flex gap-1">
                      {[cFundo, cFundo2, cFundo, cFundo2].map((c, i) => (
                        <div key={i} className="h-9 w-7 rounded" style={{ background: c, border: "1px solid rgba(255,255,255,.1)" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {erro && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-300">{erro}</p>}
        </div>

        {/* footer */}
        <div className="flex items-center gap-2 border-t border-white/8 px-6 py-4">
          {step > 0 && <button className="btn" onClick={() => setStep(step - 1)} disabled={!!busy}><ArrowLeft size={14} /> Voltar</button>}
          <div className="ml-auto flex items-center gap-2">
            {busy && <span className="flex items-center gap-2 text-[11px] text-[var(--brand-hi)]"><Loader2 size={14} className="animate-spin" /> {busy}</span>}
            {!last ? (
              <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={!canNext}>Continuar <ArrowRight size={14} /></button>
            ) : (
              <button className="btn btn-primary" onClick={gerar} disabled={!!busy}><Wand2 size={14} /> {zero ? "Criar carrossel" : "Gerar carrossel"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-[11px] text-[var(--text-md)]">{label}</span>
      <ColorInput value={value} onChange={onChange} />
    </div>
  );
}
