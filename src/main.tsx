import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./buttons.css";

// Fontes offline (@fontsource) — sem chamada externa em runtime.
// Para ADICIONAR uma fonte: 1) npm i @fontsource/<nome>  2) importe os pesos aqui
// 3) registre a stack em src/lib/resolve.ts (FONT_STACKS). Só isso.
import "@fontsource/archivo-black/400.css";
// Display pesado / viral (estilo dos carrosséis do vídeo de referência)
import "@fontsource/anton/400.css";
import "@fontsource/bebas-neue/400.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/sora/400.css";
import "@fontsource/sora/600.css";
import "@fontsource/sora/800.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/700.css";
import "@fontsource/fraunces/400-italic.css";
import "@fontsource/fraunces/600-italic.css";
import "@fontsource/syne/400.css";
import "@fontsource/syne/600.css";
import "@fontsource/syne/700.css";
import "@fontsource/syne/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/dm-sans/400-italic.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/400-italic.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
