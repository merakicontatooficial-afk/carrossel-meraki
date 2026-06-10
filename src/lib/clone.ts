import type { Slide } from "../types";
import { uid } from "../types";

/** Deep copy de slides com ids novos — base de clonar/duplicar/templates. */
export function cloneSlides(slides: Slide[]): Slide[] {
  const copy: Slide[] = JSON.parse(JSON.stringify(slides));
  return copy.map((s) => ({
    ...s,
    id: uid("sl"),
    elements: s.elements.map((e) => ({ ...e, id: uid() })),
  }));
}
