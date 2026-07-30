// Configurações da IA — SÓ a conta DONA. Deixa trocar a chave da API e os modelos
// pela interface (sem editar .env nem reiniciar), testar a conexão e ver o consumo.
// A chave NUNCA volta inteira pro navegador: só mascarada.
import { Router } from "express";
import { autenticar, exigirDono } from "../auth.js";
import * as settings from "../settings.js";
import { testarChave, imageModels, IMAGE_SIZES } from "../gemini.js";

const router = Router();
router.use(autenticar, exigirDono);

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const CAMPOS_MODELO = ["modelo_texto", "modelo_img_lite", "modelo_img_flash", "modelo_img_pro"];

function estado() {
  const chave = settings.get("gemini_api_key");
  const meta = settings.atualizadoEm("gemini_api_key");
  const modelos = {};
  for (const c of CAMPOS_MODELO) modelos[c] = { valor: settings.get(c), origem: settings.origem(c), padrao: settings.PADROES[c] };
  return {
    provedor: "Google Gemini",
    chave: {
      configurada: !!chave,
      mascara: settings.mascarar(chave),
      origem: settings.origem("gemini_api_key"),
      atualizadaEm: meta?.em ?? null,
      atualizadaPor: meta?.por ?? null,
    },
    modelos,
    // o que o sistema faz com cada nível (a interface explica ao usuário)
    resolucoes: { lite: "1K", flash: "1K", pro: IMAGE_SIZES.pro || "1K" },
    custoImagemUsd: settings.CUSTO_IMAGEM_USD,
  };
}

/** GET /api/config/ia → estado atual (chave mascarada + modelos + origem de cada um) */
router.get("/ia", (_req, res) => res.json(estado()));

/** PUT /api/config/ia → salva chave e/ou modelos. Campo vazio = volta pro .env. */
router.put(
  "/ia",
  wrap(async (req, res) => {
    const { chave, modelos } = req.body || {};
    const por = req.usuario?.nome || "";

    if (typeof chave === "string") {
      const limpa = chave.trim();
      // string vazia = "esquece o que eu salvei aqui e volta pro .env do servidor"
      if (!limpa) settings.limpar("gemini_api_key");
      else if (limpa.length < 20) return res.status(400).json({ error: "Essa chave parece curta demais — confira antes de salvar." });
      else settings.set("gemini_api_key", limpa, por);
    }

    if (modelos && typeof modelos === "object") {
      for (const campo of CAMPOS_MODELO) {
        const v = modelos[campo];
        if (typeof v !== "string") continue;
        const limpo = v.trim();
        if (!limpo) settings.limpar(campo);
        else settings.set(campo, limpo, por);
      }
    }
    res.json(estado());
  })
);

/** POST /api/config/ia/testar → faz uma chamada real e diz se a chave responde. */
router.post(
  "/ia/testar",
  wrap(async (_req, res) => {
    try {
      res.json(await testarChave());
    } catch (e) {
      // erro de chave/modelo é resposta esperada do teste, não falha do servidor
      res.json({ ok: false, erro: String(e?.message || e).slice(0, 300) });
    }
  })
);

/** GET /api/config/uso → consumo de imagens (mês e 30 dias) + custo estimado. */
router.get("/uso", (_req, res) => {
  res.json({ ...settings.resumoUso(), modelosAtuais: imageModels(), custoImagemUsd: settings.CUSTO_IMAGEM_USD });
});

export default router;
