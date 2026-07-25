// Rotas de autenticação — login por email+senha (usuários do Publisher).
import { Router } from "express";
import { login } from "../auth.js";

const router = Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ error: "informe email e senha" });
    const out = await login(email, senha);
    if (!out) return res.status(401).json({ error: "credenciais inválidas" });
    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default router;
