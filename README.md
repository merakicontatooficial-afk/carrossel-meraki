# Gerador de Carrossel · Meraki

App web estático para produzir carrosséis virais do Instagram (1080×1350) para os clientes da Meraki. **Sem IA ativa, sem backend, sem custo** — tudo roda no navegador, persistência em localStorage, fontes offline via @fontsource.

## Conceito

**Carrossel = Estrutura × Brand Kit × Conteúdo**

- **Estrutura**: esqueleto viral (Lista, Problema→Solução→Prova, Passo a passo, Antes/Depois, História). Compartilhada entre marcas.
- **Brand Kit**: pele travada da empresa (Editorial, Padrão, G2D Gestão, G2D Licenciamentos, Meraki). Cores entram como tokens — trocar de marca recolore tudo.
- **Conteúdo**: textos com marcação (`*acento*`, `_sublinhado_`, `==realce==`), imagens e ajustes manuais.

## Dois modos de edição

- **Estruturado** (padrão): preenche só os textos por papel + imagens. Guardrails ativos (limites de palavras travam a digitação).
- **Ajuste manual**: clique em qualquer elemento na prévia — fonte, tamanho, peso, entrelinha, cor (token ou hex), posição (drag), dimensão (handles nos cantos), camada, rotação. Snap nas margens de segurança e centro. Guardrails viram avisos.

## Extras sem IA

- Salvar carrossel como **template** e clonar para novo tema.
- **Coleções** por cliente/campanha (com cor), duplicáveis em bloco.
- **Paleta a partir de imagem** (quantização median-cut no canvas) → kit personalizado.
- **Carrossel contínuo**: imagem wide fatiada em tiras 1080×1350 alinhadas.
- Export: PNG 1080×1350 por slide, empacotado em `.zip`.

## Desenvolvimento

```bash
npm install
npm run dev      # editor local
npm run build    # tsc + vite build → dist/
npm run preview  # serve o build em /carrossel-meraki/
```

## Deploy (GitHub Pages)

O workflow `.github/workflows/deploy.yml` builda e publica no Pages a cada push na `main`. Setup único:

1. Criar o repo **carrossel-meraki** no GitHub e dar push (o `base` do Vite já aponta pra `/carrossel-meraki/`).
2. Em *Settings → Pages*, definir **Source: GitHub Actions**.

URL final: `https://<usuario>.github.io/carrossel-meraki/`

## Fora de escopo (futuro opcional)

Geração de copy/imagem por IA fica documentada como módulo "traga sua própria chave" (ex.: Gemini), **desligado por padrão** — só entra se a Meraki decidir habilitar.
