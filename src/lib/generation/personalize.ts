import type { LeadRow } from "../../types/database";
import type { NicheId } from "../../types/domain";
import { personalizationSchema, type Personalization } from "./contracts";
export const demonstrationContent: Record<
  NicheId,
  Personalization["illustrative"]
> = {
  clinicas: {
    label: "Conteúdo de demonstração",
    headline: "Um espaço para apresentar cuidado e atendimento",
    introduction:
      "Texto-base demonstrativo para organizar as informações da clínica. Especialidades, equipe e atendimentos precisam ser confirmados pela empresa.",
    plannedSections: ["Apresentação", "Informações confirmadas", "Contato"],
  },
  advocacia: {
    label: "Conteúdo de demonstração",
    headline: "Clareza na apresentação dos serviços jurídicos",
    introduction:
      "Texto-base demonstrativo para a apresentação institucional. Áreas de atuação, profissionais e credenciais dependem de confirmação.",
    plannedSections: [
      "Apresentação institucional",
      "Informações confirmadas",
      "Contato",
    ],
  },
  imobiliarias: {
    label: "Conteúdo de demonstração",
    headline: "Uma apresentação para conectar oportunidades",
    introduction:
      "Texto-base demonstrativo para organizar as informações da empresa. Não representa carteira de imóveis, ofertas ou condições comerciais.",
    plannedSections: ["Apresentação", "Informações confirmadas", "Contato"],
  },
  restaurantes: {
    label: "Conteúdo de demonstração",
    headline: "Um ponto de partida para apresentar o estabelecimento",
    introduction:
      "Texto-base demonstrativo. Cardápio, pratos, preços e horários devem ser informados e aprovados pelo estabelecimento.",
    plannedSections: ["Apresentação", "Informações confirmadas", "Contato"],
  },
};
const clean = (v: string | null) => v?.trim() || null;
export function buildPersonalization(lead: LeadRow): Personalization {
  const confirmed = {
    name: lead.name.trim(),
    niche: lead.niche,
    specialty: clean(lead.specialty),
    city: clean(lead.city),
    state: clean(lead.state),
    address: clean(lead.address),
    phone: clean(lead.phone),
    whatsapp: clean(lead.whatsapp),
    website: clean(lead.website),
    instagram: clean(lead.instagram),
    description: clean(lead.description),
    services: lead.services.map((s) => s.trim()).filter(Boolean),
  };
  return personalizationSchema.parse({
    schemaVersion: 1,
    sourceLeadId: lead.id,
    sourceUpdatedAt: lead.updated_at,
    confirmedOrigin: "lead_snapshot",
    confirmed,
    illustrative: demonstrationContent[lead.niche],
    missingFields: Object.entries(confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k),
  });
}
