import {
  blankLead,
  fields,
  normalize,
  urlKind,
  type DraftLead,
  type ImportLead,
} from "./model";
import { classifyLead } from "./classify";
export type Mapping = Partial<Record<keyof ImportLead, number>>;
const aliases: Record<keyof ImportLead, string[]> = {
  name: ["name", "nome", "empresa", "nome_empresa", "estabelecimento"],
  phone: ["phone", "telefone", "celular", "contato"],
  website: ["site", "website", "dominio"],
  address: ["endereco", "address"],
  city: ["cidade", "municipio", "city"],
  google_category: [
    "categoria",
    "categoria_google",
    "google_category",
    "tipo_negocio",
  ],
  segment: ["segmento", "segment"],
  instagram: ["instagram", "perfil_instagram"],
  description: ["descricao", "description"],
  niche: ["nicho", "niche"],
  specialty: ["especialidade", "specialty"],
  whatsapp: ["whatsapp", "whats"],
  state: ["estado", "uf", "state"],
  services: ["servicos", "services"],
  source: ["origem", "source", "fonte"],
  external_reference: [
    "external_reference",
    "place_id",
    "google_place_id",
    "id_externo",
  ],
  google_maps_url: [
    "google_maps_url",
    "google_maps",
    "maps_url",
    "url_google_maps",
    "link_google_maps",
  ],
};
export function autoMap(headers: string[], rows: string[][]): Mapping {
  const mapping: Mapping = {};
  for (const field of fields) {
    const index = headers.findIndex((h) =>
      aliases[field].some((a) => normalize(a) === normalize(h)),
    );
    if (index >= 0) mapping[field] = index;
  }
  const generic = headers.findIndex((h) => normalize(h) === "url");
  if (generic >= 0) {
    const kinds = new Set(
      rows
        .map((r) => r[generic]?.trim())
        .filter(Boolean)
        .map(urlKind),
    );
    const kind = kinds.size === 1 ? [...kinds][0] : undefined;
    const field =
      kind === "maps"
        ? "google_maps_url"
        : kind === "instagram"
          ? "instagram"
          : kind === "website"
            ? "website"
            : undefined;
    if (field && mapping[field] === undefined) mapping[field] = generic;
  }
  return mapping;
}
export function mapRow(
  row: string[],
  mapping: Mapping,
): { lead: DraftLead; review: boolean } {
  const lead = blankLead();
  for (const field of fields) {
    const index = mapping[field];
    if (index !== undefined)
      (lead as Record<string, string>)[field] = (row[index] ?? "").trim();
  }
  const classified = classifyLead(
    lead.name,
    lead.google_category,
    lead.segment,
  );
  const explicit = lead.niche as string;
  const nicheAliases: Record<string, DraftLead["niche"]> = {
    clinicas: "clinicas",
    clinica: "clinicas",
    advocacia: "advocacia",
    imobiliarias: "imobiliarias",
    corretores: "imobiliarias",
    restaurantes: "restaurantes",
  };
  lead.niche = explicit
    ? (nicheAliases[normalize(explicit)] ?? "")
    : classified.niche;
  if (!lead.specialty && lead.niche === "clinicas")
    lead.specialty = classified.specialty;
  if (!lead.source) lead.source = "loung_prospect";
  lead.state = lead.state.toUpperCase();
  return {
    lead,
    review:
      !lead.niche || (!explicit && classified.status === "REVIEW_REQUIRED"),
  };
}
