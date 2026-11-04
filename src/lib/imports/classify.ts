import { normalize } from "./model";
import type { NicheId } from "../../types/domain";
const rules: Record<NicheId, readonly string[]> = {
  clinicas: [
    "clinica",
    "odontolog",
    "dentista",
    "estetica",
    "psicolog",
    "fisioterap",
    "veterinar",
  ],
  advocacia: ["advocac", "advogad", "juridic", "advocatic"],
  imobiliarias: [
    "imobiliari",
    "corretordeimoveis",
    "corretoradeimoveis",
    "agenciadeimoveis",
  ],
  restaurantes: [
    "restaurante",
    "pizzaria",
    "hamburgueria",
    "sushi",
    "gastronom",
    "lanchonete",
    "churrascaria",
    "bistro",
  ],
};
const specialties = [
  ["Odontologia", ["odontolog", "dentista"]],
  ["Estética", ["estetica"]],
  ["Psicologia", ["psicolog"]],
  ["Fisioterapia", ["fisioterap"]],
  ["Veterinária", ["veterinar"]],
] as const;
export function classifyLead(name: string, category: string, segment: string) {
  const evidence = [name, category, segment].map(normalize);
  const matches = (Object.keys(rules) as NicheId[]).filter((n) =>
    rules[n].some((term) => evidence.some((v) => v.includes(term))),
  );
  const found = specialties.filter(([, terms]) =>
    terms.some((term) => evidence.some((v) => v.includes(term))),
  );
  const niche = matches.length === 1 ? matches[0] : "";
  return {
    niche,
    specialty: niche === "clinicas" && found.length === 1 ? found[0][0] : "",
    status:
      matches.length === 1 && !(niche === "clinicas" && found.length > 1)
        ? "CLASSIFIED"
        : "REVIEW_REQUIRED",
    evidence: matches,
  } as const;
}
