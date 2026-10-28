import type { ImportBatch, Lead, Prototype } from "@/types/domain";
// Todas as empresas e operações são fictícias. Nenhuma URL pública é criada.
export const demoLeads: readonly Lead[] = [
  {
    id: "l1",
    nome_empresa: "Clínica Essenza",
    nicho: "clinicas",
    especialidade: {
      id: "odontologia",
      name: "Odontologia",
      nicheId: "clinicas",
    },
    cidade: "São Paulo",
    estado: "SP",
  },
  {
    id: "l2",
    nome_empresa: "Moura & Associados",
    nicho: "advocacia",
    cidade: "Curitiba",
    estado: "PR",
  },
  {
    id: "l3",
    nome_empresa: "Habita Imóveis",
    nicho: "imobiliarias",
    cidade: "Florianópolis",
    estado: "SC",
  },
  {
    id: "l4",
    nome_empresa: "Oliva Cozinha",
    nicho: "restaurantes",
    cidade: "São Paulo",
    estado: "SP",
  },
  {
    id: "l5",
    nome_empresa: "Viva Fisioterapia",
    nicho: "clinicas",
    especialidade: {
      id: "fisioterapia",
      name: "Fisioterapia",
      nicheId: "clinicas",
    },
    cidade: "Campinas",
    estado: "SP",
  },
  {
    id: "l6",
    nome_empresa: "Helena Costa Advocacia",
    nicho: "advocacia",
    cidade: "Belo Horizonte",
    estado: "MG",
  },
  {
    id: "l7",
    nome_empresa: "André Lima Corretor",
    nicho: "imobiliarias",
    cidade: "Santos",
    estado: "SP",
  },
  {
    id: "l8",
    nome_empresa: "Mesa do Campo",
    nicho: "restaurantes",
    cidade: "Curitiba",
    estado: "PR",
  },
];
export const demoPrototypes: readonly Prototype[] = demoLeads.map(
  (lead, i) => ({
    id: `p${i + 1}`,
    leadId: lead.id,
    templateId: `${lead.nicho}-${i < 4 ? "A" : "B"}`,
    status: i % 3 === 0 ? "publicado" : i % 3 === 1 ? "revisao" : "rascunho",
    createdAt: `2026-10-${String(26 - i).padStart(2, "0")}T12:00:00Z`,
    publicUrl: null,
  }),
);
export const demoImports: readonly ImportBatch[] = [
  {
    id: "i1",
    filename: "leads_sao_paulo.csv",
    createdAt: "2026-10-26T12:00:00Z",
    total: 5,
    valid: 5,
    invalid: 0,
    status: "concluida",
    demonstration: true,
  },
  {
    id: "i2",
    filename: "prospeccao_sul.xlsx",
    createdAt: "2026-10-23T12:00:00Z",
    total: 4,
    valid: 3,
    invalid: 1,
    status: "parcial",
    demonstration: true,
  },
];
