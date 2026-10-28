// Espelho tipado das migrations. Regenerar com Supabase CLI após aplicá-las (ver README).
import type { NicheId, Variant } from "./domain";
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type DbImportStatus =
  "pending" | "processing" | "completed" | "partial" | "failed";
export type DbTemplateStatus = "planned" | "active" | "archived";
export type DbPublicationStatus = "draft" | "review" | "published";
export type AdminRow = { user_id: string; created_at: string };
export type ImportRow = {
  id: string;
  filename: string;
  status: DbImportStatus;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  created_at: string;
  completed_at: string | null;
};
export type LeadRow = {
  id: string;
  import_id: string | null;
  name: string;
  niche: NicheId;
  specialty: string | null;
  google_category: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  website: string | null;
  instagram: string | null;
  description: string | null;
  services: string[];
  source: string | null;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
};
export type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  niche: NicheId;
  variant: Variant;
  description: string;
  status: DbTemplateStatus;
  created_at: string;
  updated_at: string;
};
export type PrototypeRow = {
  id: string;
  lead_id: string;
  template_id: string;
  niche: NicheId;
  slug: string;
  status: DbPublicationStatus;
  customization_data: Json;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
type Defaults = "id" | "created_at" | "updated_at";
type Insert<Row, Required extends keyof Row> = Pick<Row, Required> &
  Partial<Omit<Row, Required>>;
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type Table<Row, New, Relations extends Relationship[] = []> = {
  Row: Row;
  Insert: New;
  Update: Partial<Omit<Row, Defaults>>;
  Relationships: Relations;
};
export type Database = {
  public: {
    Tables: {
      admin_users: Table<AdminRow, Insert<AdminRow, "user_id">>;
      imports: Table<ImportRow, Insert<ImportRow, "filename">>;
      leads: Table<
        LeadRow,
        Insert<LeadRow, "name" | "niche">,
        [
          {
            foreignKeyName: "leads_import_id_fkey";
            columns: ["import_id"];
            isOneToOne: false;
            referencedRelation: "imports";
            referencedColumns: ["id"];
          },
        ]
      >;
      templates: Table<
        TemplateRow,
        Insert<
          TemplateRow,
          "slug" | "name" | "niche" | "variant" | "description"
        >
      >;
      prototypes: Table<
        PrototypeRow,
        Insert<PrototypeRow, "lead_id" | "template_id" | "slug">,
        [
          {
            foreignKeyName: "prototypes_lead_niche_fkey";
            columns: ["lead_id", "niche"];
            isOneToOne: true;
            referencedRelation: "leads";
            referencedColumns: ["id", "niche"];
          },
          {
            foreignKeyName: "prototypes_template_niche_fkey";
            columns: ["template_id", "niche"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["id", "niche"];
          },
        ]
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      niche: NicheId;
      template_variant: Variant;
      import_status: DbImportStatus;
      template_status: DbTemplateStatus;
      publication_status: DbPublicationStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
