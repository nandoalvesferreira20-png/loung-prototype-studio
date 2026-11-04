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
  request_id: string | null;
  request_hash: string | null;
  created_by: string | null;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  duplicate_rows: number;
  error_code: string | null;
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
  segment: string | null;
  google_maps_url: string | null;
  duplicate_reason: string | null;
  identity_keys: string[];
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
  revision: number;
};
type Defaults = "id" | "created_at" | "updated_at";
export type PublishedPrototypeRow = {
  prototype_id: string;
  slug: string;
  template_identifier: string;
  payload_version: number;
  public_data: Json;
  publication_version: number;
  source_revision: number;
  published_at: string;
  updated_at: string;
  unpublished_at: string | null;
};
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
      published_prototypes: Table<PublishedPrototypeRow, PublishedPrototypeRow>;
      admin_users: Table<AdminRow, Insert<AdminRow, "user_id">>;
      imports: Table<ImportRow, Insert<ImportRow, "filename">>;
      import_lead_results: Table<
        {
          import_id: string;
          row_number: number;
          lead_id: string | null;
          outcome: string;
        },
        {
          import_id: string;
          row_number: number;
          lead_id?: string | null;
          outcome: string;
        }
      >;
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
      prototype_generation_requests: Table<
        {
          id: string;
          created_by: string | null;
          request_hash: string;
          result: Json;
          created_at: string;
        },
        {
          id: string;
          created_by?: string | null;
          request_hash: string;
          result: Json;
        }
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      publish_prototype: {
        Args: {
          p_id: string;
          p_revision: number;
          p_version: number;
          p_data: Json;
        };
        Returns: Json;
      };
      unpublish_prototype: {
        Args: { p_id: string; p_version: number };
        Returns: undefined;
      };
      preview_lead_import: { Args: { p_rows: Json }; Returns: Json };
      commit_lead_import: { Args: { p_request: Json }; Returns: Json };
      plan_prototype_generation: {
        Args: { p_ids: string[]; p_mode: string };
        Returns: Json;
      };
      generate_prototypes: { Args: { p_request: Json }; Returns: Json };
      edit_prototype: {
        Args: {
          p_id: string;
          p_revision: number;
          p_template_id: string;
          p_data: Json;
        };
        Returns: Json;
      };
      list_generation_leads: {
        Args: { p_query: string; p_niche: string; p_page: number };
        Returns: Json;
      };
      select_generation_leads: {
        Args: { p_query: string; p_niche: string };
        Returns: string[];
      };
      list_prototype_workspace: {
        Args: {
          p_query: string;
          p_niche: string;
          p_status: string;
          p_template: string | null;
          p_page: number;
        };
        Returns: Json;
      };
    };
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
