export type NicheId =
  "clinicas" | "advocacia" | "imobiliarias" | "restaurantes";
export type Variant = "A" | "B";
export type TemplateId = `${NicheId}-${Variant}`;
export type PublicationStatus = "rascunho" | "revisao" | "publicado";
export type ImportStatus = "concluida" | "parcial" | "erro";
export interface Niche {
  id: NicheId;
  name: string;
  shortName: string;
  description: string;
}
export interface Specialty {
  id: string;
  name: string;
  nicheId: NicheId;
}
export interface Template {
  id: TemplateId;
  nicheId: NicheId;
  variant: Variant;
  name: string;
  description: string;
  developmentStatus: "planejado";
}
export interface Lead {
  id: string;
  nome_empresa: string;
  nicho: NicheId;
  especialidade?: Specialty;
  categoria_google?: string;
  telefone?: string;
  whatsapp?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  site?: string;
  instagram?: string;
  descricao?: string;
  servicos?: string[];
}
export interface Prototype {
  id: string;
  leadId: string;
  templateId: TemplateId;
  status: PublicationStatus;
  createdAt: string;
  publicUrl: string | null;
}
export interface ImportBatch {
  id: string;
  filename: string;
  createdAt: string;
  total: number;
  valid: number;
  invalid: number;
  status: ImportStatus;
  demonstration: true;
}
export type LeadField = Exclude<keyof Lead, "id">;
export interface ImportField {
  key: LeadField;
  label: string;
  required: boolean;
}
export type HeaderMapping = Partial<Record<LeadField, string>>;
