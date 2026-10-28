import type {
  HeaderMapping,
  Lead,
  Prototype,
  TemplateId,
} from "@/types/domain";
// Contratos para adaptadores futuros. Nenhuma implementação remota nesta fase.
export interface PrototypeRepository {
  list(): Promise<readonly Prototype[]>;
  findByLeadId(leadId: Lead["id"]): Promise<Prototype | null>;
  // O adaptador deverá impor UNIQUE(lead_id) e validar nicho/template no banco.
  assignTemplate(
    leadId: Lead["id"],
    templateId: TemplateId,
  ): Promise<Prototype>;
}
export interface ImportService {
  preview(file: File, mapping: HeaderMapping): Promise<readonly Lead[]>;
}
