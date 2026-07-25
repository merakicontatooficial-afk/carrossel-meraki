# Backend — Plataforma de Carrosséis da Meraki

Backend fino (Node + Express) que faz o proxy da IA (Gemini) para o frontend.
Contexto e roadmap completos em [`../BLUEPRINT.md`](../BLUEPRINT.md).

## Rodar localmente

```powershell
cd server
npm install
Copy-Item .env.example .env      # e preencha GEMINI_API_KEY
npm run dev                       # http://localhost:8787
```

Confira: `GET http://localhost:8787/api/health` → `{ ok: true, hasKey: true }`.

## ⚠️ Chave da API — conta da **Meraki** (não a pessoal)

Esta plataforma **não** usa a chave Gemini pessoal do Luiz (a que roda no CRM/vault).
Crie uma chave nova logado na **conta Google da Meraki**:

1. https://aistudio.google.com/apikey → *Create API key*.
2. Cole em `server/.env` na linha `GEMINI_API_KEY=`.
3. `npm run dev`. Sem a chave, as rotas de IA respondem erro (o servidor sobe mesmo assim).

## Endpoints (Fase 1)

| Método | Rota | Faz |
|---|---|---|
| GET | `/api/health` | ping + se a chave está setada |
| POST | `/api/generate/carousel` | `{ tema, nSlides?, modelo? }` → `{ slides[], legenda }` |
| POST | `/api/generate/image` | `{ prompt, refImageBase64?, hq? }` → `{ dataUrl }` (rosto de ref + toggle 4K) |
| POST | `/api/generate/refine` | `{ texto, instrucao }` → `{ texto }` |
| POST | `/api/generate/caption` | `{ tema | slides }` → `{ legenda }` |
| GET | `/api/generate/trends` | `?q=&period=hoje\|semana\|mes` → notícias em alta |

## Modelos (env, ajustáveis)

- Texto: `gemini-2.5-flash`
- Imagem: `gemini-2.5-flash-image` (Nano Banana, grátis) · `hq:true` → `gemini-3-pro-image-preview` (Pro, 4K, pago)

Se o Google renomear algum modelo, ajuste no `.env` (`GEMINI_MODEL_*`) — sem tocar no código.

## Deploy

VPS Hostinger (`ssh meraki-vps`), atrás do Caddy, em `carrossel.merakidigital.cloud`
(mesmo padrão do site institucional). O frontend buildado (Vite) é servido estático;
o backend responde em `/api/*`.
