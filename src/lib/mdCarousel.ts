// Lê um roteiro em Markdown (escrito à mão ou pelo Claude via skill
// "carrossel-meraki") e devolve os slides prontos pro motor do carrossel.
// O formato está documentado na skill — qualquer mudança aqui precisa ser
// refletida lá, senão o .md gerado para de bater com o parser.
import type { AiModelo, AiSlide } from "./api";
import { countWords } from "../config/guardrails";
import { WORD_LIMITS } from "../config/guardrails";

export type MdImgMode = "sem" | "cartao" | "fundo";

export interface MdSlide extends AiSlide {
  /** descrição da imagem deste slide (vira prompt da IA). "" = quer imagem, sem prompt. */
  imagem?: string;
}

export interface MdDoc {
  titulo?: string;
  cliente?: string;
  identidade?: string;
  modelo?: AiModelo;
  imagens?: MdImgMode;
  handle?: string;
  legenda?: string;
  slides: MdSlide[];
  /** problemas que não impedem a importação (limites de palavras, campos ignorados…) */
  avisos: string[];
}

const MODELOS: AiModelo[] = ["minimalista", "profile", "creators", "techviral"];

const KIND_ALIAS: Record<string, AiSlide["kind"]> = {
  capa: "cover", cover: "cover", abertura: "cover",
  valor: "value", value: "value", conteudo: "value", "conteúdo": "value", slide: "value", ponto: "value",
  prova: "proof", proof: "proof", case: "proof", exemplo: "proof",
  cta: "cta", fechamento: "cta", final: "cta",
};

const norm = (s: string) => s.trim().toLowerCase().replace(/[:.]+$/, "");

/** front-matter YAML mínimo: `chave: valor` + bloco `chave: |`. Sem dependência externa. */
function parseFrontMatter(bloco: string): Record<string, string> {
  const out: Record<string, string> = {};
  const linhas = bloco.split("\n");
  for (let i = 0; i < linhas.length; i++) {
    const m = /^([A-Za-zÀ-ÿ_-]+)\s*:\s*(.*)$/.exec(linhas[i]);
    if (!m) continue;
    const chave = norm(m[1]);
    const valor = m[2].trim();
    if (valor === "|" || valor === ">") {
      // bloco indentado até a próxima chave na coluna 0
      const corpo: string[] = [];
      while (i + 1 < linhas.length && (linhas[i + 1].startsWith("  ") || !linhas[i + 1].trim())) {
        corpo.push(linhas[++i].replace(/^ {2}/, ""));
      }
      out[chave] = corpo.join("\n").trim();
    } else {
      out[chave] = valor.replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

/** "1, 3, 5" ou "[1,3,5]" → [1,3,5] */
function parseLista(v: string): number[] {
  return v.replace(/[[\]]/g, "").split(/[,;\s]+/).map((n) => parseInt(n, 10)).filter((n) => Number.isFinite(n) && n > 0);
}

const negativo = (v: string) => ["nao", "não", "no", "sem", "false", "0"].includes(norm(v));

/**
 * Converte o Markdown em slides. Tolerante: se o arquivo não usa `##`, cada
 * `#` vira um slide; sem nenhum heading, cada parágrafo vira um slide.
 */
export function parseMdCarousel(md: string): MdDoc {
  const avisos: string[] = [];
  let texto = md.replace(/\r\n/g, "\n").trim();

  // ── front-matter ──
  let fm: Record<string, string> = {};
  const fmMatch = /^---\n([\s\S]*?)\n---\n?/.exec(texto);
  if (fmMatch) {
    fm = parseFrontMatter(fmMatch[1]);
    texto = texto.slice(fmMatch[0].length).trim();
  }

  const doc: MdDoc = { slides: [], avisos };
  doc.titulo = fm["titulo"] || fm["título"] || fm["title"] || undefined;
  doc.cliente = fm["cliente"] || fm["marca"] || undefined;
  doc.identidade = fm["identidade"] || undefined;
  doc.handle = fm["handle"] || fm["arroba"] || undefined;
  doc.legenda = fm["legenda"] || fm["caption"] || undefined;

  if (fm["modelo"]) {
    const m = norm(fm["modelo"]) as AiModelo;
    if (MODELOS.includes(m)) doc.modelo = m;
    else avisos.push(`Modelo "${fm["modelo"]}" não existe — mantive o que está selecionado. Use: ${MODELOS.join(", ")}.`);
  }
  if (fm["imagens"]) {
    const v = norm(fm["imagens"]);
    const mapa: Record<string, MdImgMode> = { sem: "sem", nenhuma: "sem", "não": "sem", nao: "sem", cartao: "cartao", "cartão": "cartao", card: "cartao", fundo: "fundo", background: "fundo" };
    if (mapa[v]) doc.imagens = mapa[v];
    else avisos.push(`Modo de imagem "${fm["imagens"]}" não existe — use sem, cartao ou fundo.`);
  }

  // ── blocos de slide ──
  let blocos = texto.split(/^##\s+/m).map((b) => b.trim()).filter(Boolean);
  let temCabecalhoDeSlide = /^##\s+/m.test(texto);
  if (!temCabecalhoDeSlide) {
    // sem "##": tenta "#" como separador de slide
    blocos = texto.split(/^#\s+/m).map((b) => b.trim()).filter(Boolean);
    if (blocos.length > 1) {
      avisos.push('Sem cabeçalhos "##" — usei cada "#" como um slide. O tipo de cada slide foi deduzido pela posição.');
      // reinsere o "#" pra o corpo do bloco ser lido como headline
      blocos = blocos.map((b) => `auto\n# ${b}`);
      temCabecalhoDeSlide = true;
    }
  }
  if (!temCabecalhoDeSlide) {
    blocos = texto.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => `auto\n# ${b}`);
    if (blocos.length) avisos.push("Arquivo sem títulos de slide — quebrei por parágrafo. O resultado fica melhor com o formato da skill.");
  }

  const imgSolicitadas = fm["slides-com-imagem"] ? parseLista(fm["slides-com-imagem"]) : null;

  doc.slides = blocos.map((bloco, i) => {
    const linhas = bloco.split("\n");
    const cabecalho = norm(linhas.shift() ?? "");
    // "## capa", "## valor · erro 1", "## 2 — prova" → pega a 1ª palavra conhecida
    let kind: AiSlide["kind"] | undefined;
    for (const palavra of cabecalho.split(/[\s·—–|-]+/)) {
      if (KIND_ALIAS[palavra]) { kind = KIND_ALIAS[palavra]; break; }
    }
    if (!kind) kind = i === 0 ? "cover" : "value";

    const slide: MdSlide = { kind, headline: "" };
    const corpo: string[] = [];

    for (const linhaCrua of linhas) {
      const linha = linhaCrua.trim();
      if (!linha) { corpo.push(""); continue; }

      const chave = /^([A-Za-zÀ-ÿ-]+)\s*:\s*(.*)$/.exec(linha);
      if (chave) {
        const k = norm(chave[1]);
        const v = chave[2].trim();
        if (k === "tag" || k === "eyebrow" || k === "etiqueta") { slide.eyebrow = v; continue; }
        if (k === "imagem" || k === "image" || k === "foto") {
          if (!negativo(v)) slide.imagem = v;
          continue;
        }
      }
      // headline = primeiro heading do bloco; headings extras viram corpo
      const heading = /^#{1,6}\s+(.*)$/.exec(linha);
      if (heading) {
        if (!slide.headline) { slide.headline = heading[1].trim(); continue; }
        corpo.push(heading[1].trim());
        continue;
      }
      // tira marcadores de lista (o motor não renderiza bullets)
      corpo.push(linha.replace(/^[-*+]\s+/, "").replace(/^\d+[.)]\s+/, ""));
    }

    const body = corpo.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!slide.headline) {
      // sem "#": a primeira linha do corpo vira o título
      const [primeira, ...resto] = body.split("\n");
      slide.headline = (primeira ?? "").trim();
      const sobra = resto.join("\n").trim();
      if (sobra) slide.body = sobra;
    } else if (body) {
      slide.body = body;
    }

    if (imgSolicitadas?.includes(i + 1) && slide.imagem === undefined) slide.imagem = "";
    return slide;
  }).filter((s) => s.headline);

  // ── validação (não bloqueia, só avisa) ──
  if (!doc.slides.length) avisos.push("Nenhum slide encontrado no arquivo.");
  if (doc.slides.length > 20) avisos.push(`O arquivo tem ${doc.slides.length} slides — o Instagram aceita 20. Vou importar os 20 primeiros.`);
  doc.slides = doc.slides.slice(0, 20);

  doc.slides.forEach((s, i) => {
    const nHead = countWords(s.headline);
    if (nHead > (WORD_LIMITS.headline ?? 8)) avisos.push(`Slide ${i + 1}: título com ${nHead} palavras (ideal até ${WORD_LIMITS.headline}) — pode estourar o slide.`);
    if (s.body) {
      const nBody = countWords(s.body);
      if (nBody > (WORD_LIMITS.body ?? 15) * 2) avisos.push(`Slide ${i + 1}: corpo com ${nBody} palavras — o ideal é até ${WORD_LIMITS.body} (1 ideia por slide).`);
    }
    if (s.eyebrow && countWords(s.eyebrow) > (WORD_LIMITS.eyebrow ?? 4)) {
      avisos.push(`Slide ${i + 1}: tag com mais de ${WORD_LIMITS.eyebrow} palavras.`);
    }
  });

  return doc;
}

/** Índices (1-based) dos slides marcados com `imagem:` no .md. */
export function mdImageSlides(doc: MdDoc): number[] {
  return doc.slides.map((s, i) => (s.imagem !== undefined ? i + 1 : 0)).filter(Boolean);
}
