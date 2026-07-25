// Backend da plataforma de carrosséis da Meraki.
// Auth (usuários do Publisher) + persistência compartilhada (SQLite + mídia em disco)
// + proxy de IA (Gemini). Ver ../BLUEPRINT.md.
import "dotenv/config";
import express from "express";
import cors from "cors";
import generateRoutes from "./routes/generate.js";
import authRoutes from "./routes/auth.js";
import equipeRoutes from "./routes/equipe.js";
import dataRoutes, { mediaRouter } from "./routes/data.js";
import { autenticar } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 8787;

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "20mb" })); // imagens (WebP comprimido) vêm em base64

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "carrossel-meraki-server", hasKey: !!process.env.GEMINI_API_KEY, hasAuth: !!process.env.JWT_SECRET && !!process.env.USERS_DB_PATH });
});

app.use("/api/auth", authRoutes);          // login (aberto)
app.use("/api/media", mediaRouter);         // servir imagens (aberto)
app.use("/api/generate", autenticar, generateRoutes); // IA (protegida — custa saldo)
app.use("/api/equipe", equipeRoutes);       // gestão de acessos (só conta dona)
app.use("/api", dataRoutes);                // carousels/templates/collections/me (protegido)

// erro central
app.use((err, _req, res, _next) => {
  console.error("[erro]", err.message);
  res.status(500).json({ error: err.message || "Erro interno" });
});

app.listen(PORT, () => {
  console.log(`[server] carrossel-meraki no ar em http://localhost:${PORT}`);
  if (!process.env.GEMINI_API_KEY) console.log("[server] ⚠️  sem GEMINI_API_KEY");
  if (!process.env.JWT_SECRET || !process.env.USERS_DB_PATH) console.log("[server] ⚠️  auth incompleto (JWT_SECRET / USERS_DB_PATH)");
});
