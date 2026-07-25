# Blueprint — Plataforma de Carrosséis Virais da Meraki

> **O que é este documento:** o mapa completo para transformar o `carrossel-meraki`
> atual numa plataforma no nível do **MyPostFlow** (mypostflow.com), porém 100% da
> Meraki, hospedada no nosso domínio, com a nossa identidade visual.
>
> **Fontes:** vídeo de demonstração do MyPostFlow (YouTube `tQReKAEqB-E`, 12 min,
> assistido frame a frame + transcrição) · landing page mypostflow.com · auditoria
> do código atual do `carrossel-meraki` · `marcas/meraki/identidade.md`.
>
> **Data:** 24/07/2026.

---

## 0. Decisão central (leia primeiro)

**Não recomeçar do zero. Evoluir o que já existe.**

O `carrossel-meraki` atual já tem a parte **mais difícil** de uma ferramenta dessas
pronta e funcionando: o **motor de edição de canvas**. O que falta é tudo que fica
*em volta* dele — a camada de IA, o backend com contas, e a "casca" de produto
(dashboard, assistente de geração, trends) que faz o MyPostFlow parecer mágico.

```
                 MyPostFlow = [ casca de produto ] + [ camada de IA ] + [ motor de canvas ]
carrossel-meraki hoje =            (falta)         +      (falta)      +  ✅ já temos, e é bom
```

Reaproveitar o motor economiza semanas de trabalho e a Meraki já domina o resto do
stack (Node + Express + SQLite + React + VPS + Gemini já rodam em produção no
Publisher e no CRM).

### 0.1 Multi-cliente — princípio que atravessa tudo *(24/07)*

A ferramenta **não é só da Meraki** — é usada para **todos os clientes que a Meraki
atende**. Isso separa duas camadas que nunca se misturam:

| Camada | Veste a marca de… | Onde |
|---|---|---|
| **Interface da plataforma** (dashboard, sidebar, editor, botões) | **Meraki** (identidade fixa) | casca do produto |
| **Carrossel gerado** (cores, fontes, logo, **voz da copy**) | **o cliente da vez** (Braseiro, Sabor Grego, G2D, Duelo de Titans…) | conteúdo |

Consequências que já entraram na arquitetura:
- A geração de copy recebe a **voz do cliente** (não é fixa na voz da Meraki) —
  `buildSystem(marca)` no backend; sem marca, cai na voz da agência.
- **Brand kit + voz + logo por cliente**, ligados às **coleções** (que já existem e
  batem com os clientes reais).
- Biblioteca de **fontes ampla** (várias marcas, vários estilos) — ver §5.3.

---

## 1. O padrão-alvo: mapa COMPLETO do MyPostFlow

Tudo que a ferramenta de referência faz, extraído do vídeo e do site. Esta é a
régua — a plataforma da Meraki tem que fazer tudo isto (ou melhor).

### 1.1 Estrutura de navegação (sidebar)

Menu lateral fixo, escuro, com logo no topo. Itens vistos no vídeo:

| Item | Função |
|---|---|
| **Dashboard** | Home: saudação, atalhos, grade dos posts já gerados |
| **Estúdio** | O editor de carrossel (onde a mágica acontece) |
| **Templates** | Biblioteca de templates prontos para clonar |
| **Trendings** | Notícias em alta → vira carrossel num clique |
| **Organização** | Pastas/coleções por cliente ou campanha |
| **Members** | Contas / equipe |
| **Guia Completo** | Tutorial/onboarding |
| **API Access** | Acesso via API (tier avançado) |
| **Configurações** | Perfil, identidade visual, billing |

### 1.2 Dashboard (home)

- Saudação personalizada ("Olá, Wesley") + subtítulo ("Vamos criar conteúdo hoje?").
- **3 cards de ação rápida:**
  1. **Gerar com IA** → botão "Gerar agora" (abre o assistente de criação).
  2. **Templates** → "Explorar templates".
  3. **Treinar Carrossel** → "Configurar perfil" (treina a voz da marca).
- **Grade "Posts Gerados"**: miniaturas dos carrosséis já criados, cada card com
  ações (editar / duplicar / baixar). Visual escuro, thumbnails no estilo "viral".
- Barra de busca no topo ("Buscar carrosséis, templates, organização…").

### 1.3 Os 4 modelos (estilos visuais)

O coração do produto. Ao gerar, o usuário escolhe um dos 4 num modal "Estilo Visual"
(com preview em miniatura de cada um):

| Modelo | Descrição (do vídeo) | Caso de uso |
|---|---|---|
| **Minimalista** | Mais voltado para conteúdo com **muita informação**; headline grande, foto de fundo, texto limpo | Educacional / informativo denso |
| **Profile** | Estilo **Twitter/X** — card com nome, @, selo verificado, foto e texto tipo tweet | Opinião / autoridade / "print de tweet" |
| **Creators** | Estilo criador de conteúdo, foto forte + fundos coloridos embaralháveis | Marca pessoal / lifestyle |
| **Tech Viral** | Visual "tech" arrojado, mais elaborado e organizado, cores vivas (roxo/rosa) | Notícia de tecnologia / lançamento |

Cada modelo carrega **funções únicas** e um layout próprio.

### 1.4 Fluxo de geração (o assistente)

Passo a passo exato observado no vídeo:

1. **Entrada de conteúdo** — 3 caminhos:
   - Digitar tema/prompt ("Gerar com IA": *"crie um conteúdo sobre como viralizar…"*).
   - Puxar de uma **notícia do Trendings** (preenche o prompt automaticamente).
   - Colar um texto próprio.
2. **Continuar** → escolhe **quantidade de slides** (5, 6, 7… livre).
3. Escolhe **qual dos 4 modelos**.
4. Escolhe **cor de acento** (paleta — ex.: rosa, roxo).
5. Decide **imagem na capa**: sem imagem / com imagem gerada por IA.
6. **Gerar** → em **menos de 1 minuto** o carrossel inteiro fica pronto (texto +
   layout + imagens).

### 1.5 Trendings (o diferencial de pauta)

- Página com **busca por tema** + filtro de data (Hoje / Esta semana / Este mês /
  Qualquer data).
- Retorna **cards de notícias reais em alta**, com fonte, "há X horas/dias" e
  headline.
- Cada card tem botão **"Gerar carrossel"** → joga a notícia direto no assistente.
- No vídeo: buscou "Claude Code" e vieram notícias recentes (inclusive o lançamento
  do "Fable 5") que viraram carrossel na hora.

### 1.6 Editor / Estúdio — controles

Top bar: seletor de **formato** (Carrossel / Story / Post quadrado), navegação de
slides ("Slide 1 de 7"), **Baixar Slide** / **Baixar Todos**, **Salvar**,
**Gerar Legenda** (botão de destaque).

Painel lateral de ferramentas (cada uma abre um conjunto de controles):

- **Capa do Post** / **Templates de Estilo** — troca o look.
- **Gerar com IA** — regenera conteúdo.
- **Identidade Visual** — cores, fontes, logo da marca.
- **Imagem de Fundo** — gerar com IA / anexar do Google / colar / deletar / trocar.
- **Sombra / Overlay** — opacidade e intensidade da sombra sobre a foto.
- **Fundo do Slide** — cor sólida, embaralhar fundos, trocar cores.
- **Grade de Imagens** — layout de múltiplas imagens.
- **Texto & IA** — editar título/subtítulo/corpo, **tamanho** (sliders), **fonte**,
  **posição**, e **"Refinar slide com IA"** (ex.: "deixa esse texto menor").

Edição fina vista no vídeo: trocar fonte por slide, aumentar/diminuir título e
subtítulo, remover os "cantinhos"/molduras, ajustar zoom e posição da imagem,
arredondar mais/menos as imagens, mudar opacidade da sombra.

### 1.7 Imagem por IA com **rosto de referência** (feature-assinatura)

O recurso que mais impressiona no vídeo:

- Botão **"Gerar imagem com IA"** → gera uma imagem que combina com o conteúdo do
  slide, automaticamente.
- Pode **anexar uma foto de referência** (o **rosto** da pessoa, ou um **produto**)
  → a IA gera a imagem **usando aquele rosto/produto** na cena.
- Aceita **prompt livre** para dirigir a imagem (ex.: *"eu usando um MacBook num
  estúdio profissional com LEDs roxas de fundo, de moletom preto"*).
- Também dá pra **anexar imagem do Google** ou **colar**, e **trocar/deletar/regenerar**.

### 1.8 Outras funções

- **Refinar por slide com IA** (encolher/reescrever o texto de um slide específico).
- **Gerar Legenda** (caption do post pronta, com CTA no fim).
- **Transformar formato**: um mesmo conteúdo vira Carrossel, Story ou Post quadrado.
- **Salvar como template**.
- **Calendário de conteúdo** (30 dias — citado no site).
- **Treinar a voz da marca** ("Treinar Carrossel" / brand voice).
- **Organização em pastas** por cliente/campanha.
- **Export em Full HD**.

### 1.9 Modelo de negócio (referência)

Créditos por plano (Semanal R$47,90 / Mensal R$97,90 / Anual R$297,90). Créditos são
gastos nas gerações de IA (texto e, principalmente, imagem). Carrosséis "ilimitados",
o que consome crédito é a IA. *(Para a Meraki é uso interno da agência — ver §7.)*

---

## 2. O que o `carrossel-meraki` JÁ tem (auditoria)

Boa notícia: o motor está sólido. Levantamento do código atual:

| Já existe ✅ | Onde |
|---|---|
| Motor de canvas 1080×1350 (4:5) com elementos posicionáveis (texto, imagem, shape, barra social IG) | `src/types.ts`, `src/components/SlideCanvas.tsx` |
| Rich text com `*destaque*`, `_sublinhado_`, `==realce==` | `src/lib/richtext.tsx` |
| **Brand kits** editáveis (cores, fontes, logo, gradiente de acento) — trocar kit recolore tudo | `src/config/kits.ts` |
| **Estruturas virais** (templates de layout na linhagem MyPostFlow) | `src/config/structures.ts` |
| Editor completo: filmstrip de slides, inspetor manual, painel de identidade, logo, moldura, contador | `src/components/Editor/*` |
| Foto de fundo com **zoom, pan e scrim** (gradiente escuro estilo viral) | `Slide.bgImage/bgScale/scrim` |
| **Carrossel contínuo** (fatia uma imagem larga em N slides) | `src/lib/slice.ts` |
| **Coleções** por cliente/campanha | `src/components/Library/Collections.tsx` |
| Salvar como **template** (com o design completo) | `App.tsx` |
| **Export PNG → ZIP** de todos os slides em 1080×1350 | `src/lib/export.ts` (html-to-image + JSZip) |
| Persistência local (localStorage) | `src/lib/storage.ts` |

| Falta ❌ (é o que este blueprint adiciona) |
|---|
| **Qualquer IA** — geração de texto, imagem, refino, legenda, trends |
| **Backend** — hoje é 100% client-side/localStorage; sem contas, sem sync |
| **Login / contas / equipe** (Members) |
| **Dashboard** no estilo MyPostFlow (hoje abre direto na biblioteca) |
| **Assistente de geração** (o wizard de 5 passos) |
| **Trendings** (busca de notícias) |
| Os **4 modelos nomeados** (Minimalista/Profile/Creators/TechViral) empacotados |
| **Imagem por IA com rosto de referência** |
| **Transformar formato** (Carrossel ↔ Story ↔ Post) |
| **Gerar legenda** |
| Export em **Full HD real** garantido + naming |

**Veredito:** ~40% do trabalho difícil (o editor) já está feito. As próximas fases
constroem a IA, o backend e a casca.

---

## 3. Integrações de IA — decisão e ferramentas

> Você levantou: usar **Google Gemini via API** ou **ChatGPT via API** (verificando
> se tem API grátis). **Verifiquei — a resposta é clara.**

### 3.1 Grátis? Gemini ganha, e não é perto

- **Google Gemini** tem o **free tier mais generoso do mercado**, permanente, sem
  sistema de créditos: ~15 req/min e ~1 milhão de tokens/dia no Gemini Flash, de
  graça. ([fonte](https://pecollective.com/tools/gemini-free-tier-guide/))
- **OpenAI / ChatGPT** **não tem free tier de API permanente** — só US$5 de crédito
  de teste que **expira em 3 meses**; depois é tudo pago. GPT-mini/nano aparecem como
  "Free: Not supported". ([fonte](https://freeainews.com/news/openai-free-tier-developers-2026/))

### 3.2 Recomendação: **tudo no Gemini**

Além de ser grátis/barato, **a Meraki já usa Gemini em produção**: o bot financeiro
do CRM roda em Gemini, e a skill `nanobanana` já gera imagem via **Gemini Flash
Image ("Nano Banana")**. Ou seja, chave, faturamento e know-how já existem.

| Função da plataforma | Modelo Gemini | Observação |
|---|---|---|
| Gerar texto do carrossel (títulos, corpo, slides) | **Gemini 2.5 Flash** (texto) | rápido e no free tier |
| Refinar slide / reescrever / encurtar | Gemini 2.5 Flash | mesmo endpoint |
| Gerar legenda (caption + CTA) | Gemini 2.5 Flash | idem |
| **Gerar imagem** (fundo, cena) | **Gemini 2.5 Flash Image** (Nano Banana) | já usado na skill `nanobanana` |
| **Imagem com rosto/produto de referência** | Gemini 2.5 Flash Image (image-to-image / edição com imagem de referência) | é exatamente o "seu rosto no carrossel"; o modelo aceita imagem de entrada + prompt |
| Estruturar pauta a partir de notícia (Trendings) | Gemini 2.5 Flash | resume a notícia e vira slides |

> **Regra de ouro de custo:** texto é praticamente de graça; **imagem é o que
> consome**. Cada geração de imagem deve ser explícita (botão), com opção de
> "sem imagem" no fluxo rápido — igual ao MyPostFlow.

### 3.4 Qualidade de imagem — estratégia de 2 níveis *(decisão 24/07)*

Existe modelo mais potente que o Flash, mas o topo **não é grátis**. Estratégia
híbrida: grátis por padrão, 4K por centavos só quando vale a pena (capa/versão final).

| Nível | Modelo | Qualidade | Custo |
|---|---|---|---|
| **Padrão** (default) | **Nano Banana** — Gemini 2.5 Flash Image | 1024px, já faz **rosto de referência** | ✅ grátis, ~500 img/dia |
| **Alta qualidade** (toggle "4K") | **Nano Banana Pro** — Gemini 3 Pro Image | 4K, texto 94% preciso, consistência de rosto superior | ❌ ~US$0,13/img |
| Alternativa fotorrealista | Imagen 4 Fast | fotorrealismo alto | ❌ ~US$0,02/img |

UI: botão **"Alta qualidade (4K)"** por imagem. Como é uso interno, o custo do Pro
é irrelevante por carrossel. ([ref](https://www.aifreeapi.com/en/posts/gemini-image-generation-free-api))

> **⚠️ Realidade confirmada ao vivo (24/07, chave da Meraki):** neste projeto novo o
> **free tier de imagem via API é ZERO** (todos os modelos de imagem — Nano Banana,
> 3.1, Pro — retornam `limit: 0`). O "500/dia grátis" que se lê por aí é do **app web
> do AI Studio**, não da API. Ou seja: **texto é grátis e já funciona**; para gerar
> **imagem é preciso ativar faturamento** no projeto Google Cloud da Meraki. Com
> billing ligado, cada imagem sai centavos (Nano Banana ~US$0,02–0,04; Pro ~US$0,13).
> **Ação do Luiz:** ativar billing na conta Meraki para destravar imagem. Sem isso, a
> plataforma gera todo o carrossel (texto/layout) e só a geração de imagem fica off.

### 3.5 Chave da API — conta **da Meraki**, separada da pessoal *(decisão 24/07)*

A chave Gemini que já roda no vault (CRM/nanobanana) é da **conta pessoal do Luiz** —
fica intocada. Esta plataforma usa uma **chave nova, de conta Google da Meraki**,
criada no Google AI Studio e guardada **só no `.env` do backend** (server-side;
nunca no vault, nunca no browser). É o único passo que depende do Luiz para testar
ao vivo. Env: `GEMINI_API_KEY`.

### 3.6 Trendings — Gemini com Google Search grounding *(decisão 24/07)*

Decidido: **Gemini com Google Search grounding** como motor de trends (default,
grátis) — o próprio modelo consulta a web ao vivo e devolve a notícia em alta já
refinada. Arquitetura fica **multi-provedor** (o motor de trends é plugável).

**Perplexity — vale como upgrade opcional pago.** É genuinamente forte para "o que
está em alta AGORA num nicho", com citações — muitas vezes melhor que o grounding do
Gemini para pauta de nicho. Mas **não tem free tier de API** permanente: Sonar custa
por token + taxa por request (assinantes Pro ganham ~US$5/mês de crédito de API;
contas novas ganham ~US$25–50 de trial). ([ref](https://www.aipricing.guru/perplexity-pricing/))
Decisão: **Gemini grounding como padrão grátis**; deixar um "provedor premium de
trends" (Perplexity Sonar) plugável para nichos que exijam pesquisa mais afiada —
mesmo espírito do 4K na imagem: grátis por padrão, pago quando vale. Não construir
agora; a interface do provedor de trends já nasce trocável.

### 3.3 Trendings — de onde vêm as notícias

O Gemini sozinho não traz notícia em tempo real de forma confiável. Opções (do mais
simples ao mais robusto):

1. **Gemini com Google Search grounding** (o modelo consulta a web na hora) — mais
   simples, boa cobertura, mas menos controle sobre "o que está em alta hoje".
2. **API de notícias** dedicada (ex.: GNews, NewsAPI, NewsData.io — todas com free
   tier) → lista de manchetes por tema/data → Gemini transforma em carrossel.
   *Recomendado* para bater o filtro "Hoje / Esta semana" do MyPostFlow.
3. **Fallback**: RSS de portais (grátis, sem API) filtrados por palavra-chave.

Decisão sugerida: **NewsData.io/GNews (free) para a lista + Gemini para virar pauta**.

---

## 4. Especificação funcional da plataforma Meraki

O produto final, tela a tela. Nomes já adaptados à Meraki.

### 4.1 Telas

1. **Login / contas** — e-mail+senha (ou magic link). Uso interno da agência, então
   poucas contas (equipe Meraki). Membros com papéis.
2. **Dashboard** — saudação, 3 cards (Gerar com IA · Templates · Treinar Marca),
   grade "Meus Carrosséis", busca global.
3. **Assistente de Geração** (modal/wizard) — os 5 passos do §1.4.
4. **Estúdio** (editor) — evolução do editor atual + painéis de IA (§1.6).
5. **Trendings** — busca de pauta (§1.5).
6. **Templates** — biblioteca (já existe, ganha capa e categorias por modelo).
7. **Organização** — coleções por cliente (já existe; alinhar aos clientes reais:
   Braseiro, Sabor Grego, G2D, Duelo de Titans…).
8. **Configurações** — perfil da marca, identidade visual, chaves, consumo de IA.

### 4.2 Os 4 modelos como "famílias de estrutura"

Empacotar o que já existe em `structures.ts`/`kits.ts` como 4 famílias nomeadas,
cada uma com layout + kit default próprios:

- **Minimalista** — headline grotesca em caixa alta, foto full-bleed com scrim, corpo
  curto. *(Já é praticamente a linhagem atual das structures.)*
- **Profile** — card estilo tweet: avatar + nome + @ + selo + texto. **Novo layout.**
- **Creators** — foto forte, fundos coloridos embaralháveis, acento vibrante.
- **Tech Viral** — layout tech, cores vivas, mais elementos gráficos (usar os
  elementos 3D roxos da IDV Meraki — §5).

### 4.3 Camada de IA no editor (novos painéis)

- **"Gerar com IA"** → chama backend → preenche os slides.
- **"Imagem com IA"** por slide → prompt + upload de rosto/produto opcional → Nano
  Banana → aplica no `bgImage` (reaproveita zoom/pan/scrim que já existem).
- **"Refinar com IA"** por slide → manda o texto atual + instrução → substitui.
- **"Gerar Legenda"** → caption pronta com CTA (usar as regras de copy da Meraki).
- **"Treinar Marca"** → salva tom de voz/exemplos por cliente → injeta no prompt.

### 4.4 Formatos

Generalizar o canvas para 3 proporções (o motor já é parametrizável em `CANVAS_W/H`):
- **Carrossel** 1080×1350 (4:5) — atual.
- **Story** 1080×1920 (9:16).
- **Post** 1080×1080 (1:1).
Botão "Transformar em…" reflui os elementos.

---

## 5. Identidade visual — **é a da Meraki** (já definida)

Fonte única: `marcas/meraki/identidade.md` (BRAND.md v2.0 + seção v3). A casca da
plataforma (dashboard, sidebar, editor) **não** é a cara do MyPostFlow — é a cara da
Meraki. O que copiamos do MyPostFlow é a **estrutura/funcionalidade**, não o visual.

| Token | Valor | Uso na plataforma |
|---|---|---|
| **Roxo oficial (do site)** | **`#5103c1`** | **acento, gradientes, CTAs — é o roxo travado (24/07)** |
| Roxo claro (glow/superfície) | `#7E65D8` | só glow/superfície secundária; **não** é o acento principal |
| Deep Purple | `#320C56` | fundos premium, formas 3D |
| Preto | `#000000` | fundo principal (dark-first) |
| Fonte | **Poppins** (500/600/700) | tudo na UI |
| Botão | **pílula, contorno branco** sobre preto (não roxo preenchido) | CTAs da casca |
| Cards | glassmorphism roxo (`blur 12–18px`, borda roxa translúcida) | painéis, modais |
| Movimento | curva `cubic-bezier(0.16,1,0.3,1)`, respeitar `prefers-reduced-motion` | transições |

> **Roxo travado (24/07):** vale a **identidade do site** — roxo `#5103c1`, Poppins,
> botão pílula de contorno branco, vidro. Não usar o `#7E65D8` do carrossel antigo
> como acento. Reaproveitar `meraki-site/assets/css/buttons.css` e `consent.css`.

**Nota:** os 4 *modelos de carrossel* (Minimalista/Profile/etc.) são estilos do
**conteúdo gerado** e podem fugir do roxo Meraki (o cliente final tem a marca dele).
A **identidade Meraki manda na interface**, não necessariamente no carrossel do
cliente — que herda o brand kit escolhido.

### 5.3 Biblioteca de fontes *(24/07)*

Como a ferramenta é multi-cliente, precisa de um leque de fontes bom — cada marca
escolhe a sua. Fontes **auto-hospedadas via `@fontsource`** (zero chamada externa em
runtime; respeita o padrão da Meraki). Já registradas (algumas no estilo das que
aparecem no vídeo de referência — display pesado em caixa alta):

| Papel | Fontes disponíveis |
|---|---|
| Display pesado / viral (uppercase) | **Archivo Black**, **Anton**, **Bebas Neue**, Syne |
| Tech / geométrica | **Space Grotesk**, Sora |
| Sans limpa (corpo/UI) | Poppins, Inter, DM Sans, Manrope |
| Editorial / serifa | Fraunces |
| Mono | Space Mono |

**Adicionar fonte no futuro = 3 passos** (o Luiz pediu extensibilidade):
1. `npm i @fontsource/<nome>` em `carrossel-meraki/`.
2. Importar os pesos em `src/main.tsx`.
3. Registrar a stack em `src/lib/resolve.ts` (`FONT_STACKS`).
Aparece automaticamente no seletor de fontes de todas as marcas. Poppins segue como
a fonte da **interface Meraki**; as demais são para os **carrosséis dos clientes**.

---

## 6. Arquitetura técnica

### 6.1 Stack recomendado (alinhado ao que a Meraki já opera)

```
Frontend:  React + Vite + TypeScript   (já é a base do carrossel-meraki)
Backend:   Node + Express              (mesmo do Publisher e do CRM)
Banco:     SQLite                      (mesmo padrão; migrar localStorage → API)
IA:        Google Gemini API           (texto + Nano Banana p/ imagem)
Notícias:  NewsData.io/GNews (free)    (Trendings)
Auth:      sessão simples / magic link (poucas contas internas)
Deploy:    VPS Hostinger (meraki-vps)  (Caddy, como o site institucional)
Domínio:   subdomínio Meraki (ex.: carrossel.merakidigital.cloud ou postflow.…)
```

Racional: reaproveitar infra, padrões de deploy, chave Gemini e experiência do time.
Nada de stack novo.

### 6.2 Por que precisa de backend agora

O app hoje é client-only. Três coisas forçam um backend:
1. **Chaves de IA** não podem ir pro browser (Gemini/News) → proxy no backend.
2. **Contas + sync** entre dispositivos e equipe (Members).
3. **Geração de imagem** e trends são chamadas server-side.

O editor e o export **continuam no cliente** (o motor atual). O backend é fino:
auth + proxy de IA + persistência.

### 6.3 Endpoints (esboço)

```
POST /api/generate/carousel   { tema, nSlides, modelo, cor, capaComImagem } → slides[]
POST /api/generate/image      { prompt, refImage?, slideContext } → dataURL/URL
POST /api/refine/slide        { texto, instrucao } → texto
POST /api/generate/caption    { carrossel, marca } → legenda
GET  /api/trends?q=&period=   → [{ fonte, quando, titulo, resumo }]
CRUD /api/carousels /api/collections /api/templates /api/brand-voice
POST /api/auth/login  /api/auth/me
```

### 6.4 Migração de dados

`localStorage` → API. Manter modo offline como fallback é opcional; o simples é
migrar a persistência para o backend e importar o que houver local no primeiro login.

---

## 7. Modelo de uso (Meraki vs. MyPostFlow)

O MyPostFlow vende créditos. Para a Meraki é **ferramenta interna da agência** — não
precisa de billing/paywall na v1. Mas **vale rastrear consumo de IA** (principalmente
imagem) por cliente/coleção, para (a) controlar custo e (b) no futuro, se quiser,
virar produto vendável para terceiros. Deixar a arquitetura preparada para créditos,
sem construir a cobrança agora.

---

## 8. Roadmap por fases

Ordem pensada para entregar valor cedo e deixar o difícil (imagem com rosto) só
depois que o esqueleto estiver de pé.

### Fase 1 — Fundação com IA de texto *(maior salto de valor)*
- Backend fino (Express) + proxy Gemini + auth simples.
- **Assistente de geração** (wizard) com **Gemini texto** preenchendo os slides.
- **Gerar Legenda** e **Refinar slide com IA**.
- Empacotar os **4 modelos** nomeados.
- **Dashboard** no estilo MyPostFlow com a cara da Meraki.
> Resultado: já dá pra gerar carrossel inteiro por prompt, editar e baixar. 80% do "uau".

### Fase 2 — Imagem por IA
- **Gerar imagem** (Nano Banana) para fundo/cena.
- **Imagem com rosto/produto de referência** (a feature-assinatura).
- Integração fina com zoom/pan/scrim já existentes.

### Fase 3 — Trendings
- API de notícias + filtro de data + "Gerar carrossel" a partir da manchete.

### Fase 4 — Escala e polimento
- Formatos Story/Post + "Transformar em…".
- **Treinar voz da marca** por cliente.
- Members/equipe, consumo de IA por cliente, calendário de conteúdo.
- Export Full HD garantido + deploy no domínio Meraki.

---

## 9. Decisões — TRAVADAS em 24/07/2026

| # | Decisão | Status |
|---|---|---|
| 0 | **Multi-cliente**: UI = Meraki, carrossel = marca+voz do cliente | ✅ travado (§0.1) |
| 1 | **IA = Google Gemini** (ChatGPT descartado, sem API grátis) | ✅ travado |
| 2 | **Imagem**: Nano Banana padrão + toggle "4K" (Pro). **Sem free tier de imagem na API** → precisa billing | ✅ travado (§3.4) |
| 3 | **Chave** da conta Meraki no `.env` — colada e **testada: texto funciona** | ✅ feito |
| 3b | **Billing** do projeto Google Cloud da Meraki (destrava imagem) | ⏳ **pendente do Luiz** |
| 4 | **Roxo oficial** = `#5103c1` (identidade do site, não o `#7E65D8` antigo) | ✅ travado |
| 5 | **Fontes** = Poppins na UI + biblioteca ampla p/ clientes (extensível) | ✅ travado (§5.3) |
| 6 | **Trendings** = Gemini grounding (grátis) + Perplexity Sonar opcional pago | ✅ travado (§3.6) |
| 7 | **Domínio** = `carrossel.merakidigital.cloud` | ✅ travado |
| 8 | **Uso** = interno da agência; sem billing na v1, mas arquitetura credit-ready | ✅ travado |
| 9 | **Modelos Gemini** = `gemini-flash-latest` (texto), `gemini-2.5-flash-image` (img), `gemini-3-pro-image` (4K) | ✅ testado |

**Ainda a definir (não bloqueia o início):**
- Ativar billing (destrava imagem) + teto de custo de imagem 4K por cliente/mês.
- Política de consentimento para gerar imagem com o **rosto** de clientes.

---

## 10. Resumo de uma linha

> Já temos o motor de edição (o mais difícil). Este blueprint pluga **Gemini**
> (grátis e já em uso na Meraki) para texto e imagem, adiciona um **backend fino** e
> uma **casca com a cara da Meraki** copiando a *estrutura* do MyPostFlow — e entrega
> a mesma mágica ("prompt → carrossel viral em 1 minuto") sob o nosso domínio.
