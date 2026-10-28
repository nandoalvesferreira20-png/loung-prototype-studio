import { demoLeads } from "@/data/demo";
import type {
  Prototype,
  NicheId,
  PublicationStatus,
  TemplateId,
} from "@/types/domain";
export interface PrototypeFilters {
  query: string;
  niche: NicheId | "";
  status: PublicationStatus | "";
  template: TemplateId | "";
}
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
export function filterPrototypes(
  items: readonly Prototype[],
  filters: PrototypeFilters,
) {
  return items.filter((item) => {
    const lead = demoLeads.find((lead) => lead.id === item.leadId);
    return (
      lead &&
      normalize(
        `${lead.nome_empresa} ${lead.especialidade?.name ?? ""}`,
      ).includes(normalize(filters.query.trim())) &&
      (!filters.niche || lead.nicho === filters.niche) &&
      (!filters.status || item.status === filters.status) &&
      (!filters.template || item.templateId === filters.template)
    );
  });
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
