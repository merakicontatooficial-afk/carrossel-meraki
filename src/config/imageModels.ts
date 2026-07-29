// Modelos de imagem oferecidos na plataforma. As CHAVES precisam bater com o
// IMAGE_MODELS do servidor (server/src/gemini.js) — mudou aqui, muda lá.
//
// Base: teste visual de 29/07/2026 (mesmo prompt nos três, conta da Meraki).
// Os três devolvem a mesma resolução; o Lite só perde em microtextura de pele
// quando o rosto aparece grande no slide. Por isso ele é o padrão.
export type ImageModelKey = "lite" | "flash" | "pro";

export interface ImageModelInfo {
  key: ImageModelKey;
  curto: string;
  nome: string;
  custo: string;
  nota: string;
}

export const IMAGE_MODELS: ImageModelInfo[] = [
  {
    key: "lite",
    curto: "Lite",
    nome: "Nano Banana 2 Lite",
    custo: "R$ 0,17 · ~3 s",
    nota: "Padrão. Dá conta de comida, produto e ambiente — e é rápido o bastante pra gerar variações.",
  },
  {
    key: "flash",
    curto: "NB 2",
    nome: "Nano Banana 2",
    custo: "R$ 0,34 · ~25 s",
    nota: "Um degrau em pele e detalhe fino. Use quando o rosto ocupar boa parte do slide.",
  },
  {
    key: "pro",
    curto: "Pro",
    nome: "Nano Banana Pro",
    custo: "R$ 0,69 · ~30 s",
    nota: "Máximo acabamento e luz cinematográfica. Para a imagem que carrega o post inteiro.",
  },
];

export const IMAGE_MODEL_DEFAULT: ImageModelKey = "lite";

const STORE_KEY = "cg.imageModel.v1";

/** Último modelo escolhido (fica salvo entre sessões). */
export function getImageModel(): ImageModelKey {
  const v = localStorage.getItem(STORE_KEY) as ImageModelKey | null;
  return IMAGE_MODELS.some((m) => m.key === v) ? (v as ImageModelKey) : IMAGE_MODEL_DEFAULT;
}

export function setImageModel(key: ImageModelKey) {
  localStorage.setItem(STORE_KEY, key);
}
