// Backend da plataforma de carrosséis da Meraki.
// Fase 1: auth virá depois; por ora, proxy de IA (Gemini) + health.
import "dotenv/config";
import express from "express";
import cors from "cors";
import generateRoutes from "./routes/generate.js";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "15mb" })); // fotos de referência vêm em base64

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "carrossel-meraki-server", hasKey: !!process.env.GEMINI_API_KEY });
});

app.use("/api/generate", generateRoutes);

// erro central
app.use((err, _req, res, _next) => {
  console.error("[erro]", err.message);
  res.status(500).json({ error: err.message || "Erro interno" });
});

app.listen(PORT, () => {
  console.log(`[server] carrossel-meraki no ar em http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log("[server] ⚠️  sem GEMINI_API_KEY — crie a chave da Meraki e cole no .env");
  }
});
