import type { ImportField, Niche, Template } from "@/types/domain";
export const niches: readonly Niche[] = [
  {
    id: "clinicas",
    name: "Clínicas",
    shortName: "Clínicas",
    description: "Saúde, cuidado e bem-estar",
  },
  {
    id: "advocacia",
    name: "Advocacia",
    shortName: "Advocacia",
    description: "Presença digital com credibilidade",
  },
  {
    id: "imobiliarias",
    name: "Imobiliárias e Corretores",
    shortName: "Imobiliárias",
    description: "Imóveis e conexões de valor",
  },
  {
    id: "restaurantes",
    name: "Restaurantes",
    shortName: "Restaurantes",
    description: "Experiências que abrem o apetite",
  },
];
export const templates: readonly Template[] = [
  {
    id: "clinicas-A",
    nicheId: "clinicas",
    variant: "A",
    name: "Institucional Premium",
    description:
      "Uma presença acolhedora, com foco na confiança e na especialidade da clínica.",
    developmentStatus: "planejado",
  },
  {
    id: "clinicas-B",
    nicheId: "clinicas",
    variant: "B",
    name: "Serviços e Agendamentos",
    description: "Serviços em destaque e uma jornada direta até o agendamento.",
    developmentStatus: "planejado",
  },
  {
    id: "advocacia-A",
    nicheId: "advocacia",
    variant: "A",
    name: "Clássico e Sofisticado",
    description: "Tradição e autoridade em uma composição editorial sóbria.",
    developmentStatus: "planejado",
  },
  {
    id: "advocacia-B",
    nicheId: "advocacia",
    variant: "B",
    name: "Moderno e Minimalista",
    description:
      "Clareza e precisão para apresentar áreas de atuação e equipe.",
    developmentStatus: "planejado",
  },
  {
    id: "imobiliarias-A",
    nicheId: "imobiliarias",
    variant: "A",
    name: "Imobiliária Premium",
    description:
      "Uma vitrine elegante para imóveis e oportunidades exclusivas.",
    developmentStatus: "planejado",
  },
  {
    id: "imobiliarias-B",
    nicheId: "imobiliarias",
    variant: "B",
    name: "Corretor Pessoal",
    description: "Atendimento próximo, marca pessoal e imóveis selecionados.",
    developmentStatus: "planejado",
  },
  {
    id: "restaurantes-A",
    nicheId: "restaurantes",
    variant: "A",
    name: "Gastronômico Premium",
    description:
      "Atmosfera e identidade para valorizar a experiência gastronômica.",
    developmentStatus: "planejado",
  },
  {
    id: "restaurantes-B",
    nicheId: "restaurantes",
    variant: "B",
    name: "Cardápio e Pedidos",
    description:
      "Um cardápio acessível com caminho simples para novos pedidos.",
    developmentStatus: "planejado",
  },
];
export const importFields: readonly ImportField[] = [
  { key: "nome_empresa", label: "Nome da empresa", required: true },
  { key: "nicho", label: "Nicho", required: false },
  { key: "especialidade", label: "Especialidade", required: false },
  { key: "categoria_google", label: "Categoria Google", required: false },
  ...(
    [
      "telefone",
      "whatsapp",
      "endereco",
      "cidade",
      "estado",
      "site",
      "instagram",
      "descricao",
      "servicos",
    ] as const
  ).map((key) => ({
    key,
    label:
      (
        {
          endereco: "Endereço",
          descricao: "Descrição",
          servicos: "Serviços",
        } as Record<string, string>
      )[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
    required: false,
  })),
];
export const studioConfig = {
  name: "Loung Prototype Studio",
  mode: "demonstration",
  phase: "2.1",
} as const;
export const publicationLabels = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
} as const;
