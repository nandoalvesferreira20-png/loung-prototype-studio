import { z } from "zod";
import type { NicheId } from "../../types/domain";

export const IMPORT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxRows: 500,
  maxColumns: 50,
  maxExpandedBytes: 20 * 1024 * 1024,
  maxEntries: 200,
  timeoutMs: 20000,
} as const;
export const nicheIds = [
  "clinicas",
  "advocacia",
  "imobiliarias",
  "restaurantes",
] as const;
export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
export function urlKind(
  value: string,
): "maps" | "instagram" | "social" | "website" | "invalid" {
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return "invalid";
    const host = url.hostname.toLowerCase();
    if (/^(www\.)?instagram\.com$/.test(host)) return "instagram";
    if (
      /^(www\.)?(facebook\.com|fb\.com|linkedin\.com|tiktok\.com|youtube\.com|wa\.me|twitter\.com|x\.com)$/.test(
        host,
      )
    )
      return "social";
    if (
      host === "maps.app.goo.gl" ||
      (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
      (/(^|\.)google\.[a-z.]+$/.test(host) &&
        (url.pathname.startsWith("/maps") || host.startsWith("maps.")))
    )
      return "maps";
    return "website";
  } catch {
    return "invalid";
  }
}
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Contém caracteres de controle.",
    );
const optionalUrl = (kind: "website" | "instagram" | "maps") =>
  text(2048).refine(
    (v) => !v || urlKind(v) === kind,
    `Informe uma URL HTTP(S) válida de ${kind === "maps" ? "Google Maps" : kind === "instagram" ? "Instagram" : "site da empresa"}.`,
  );
export const leadSchema = z
  .object({
    name: text(255).min(1, "Informe o nome da empresa."),
    niche: z.enum(nicheIds, { error: "Selecione um dos quatro nichos." }),
    specialty: text(120),
    google_category: text(255),
    segment: text(255),
    phone: text(60).refine(
      (v) => !v || /^\+?[0-9 ()\-.\/]{3,60}$/.test(v),
      "Telefone inválido; preserve o prefixo e os zeros.",
    ),
    whatsapp: text(60).refine(
      (v) => !v || /^\+?[0-9 ()\-.\/]{3,60}$/.test(v),
      "WhatsApp inválido.",
    ),
    address: text(500),
    city: text(120),
    state: text(2).refine(
      (v) => !v || /^[A-Z]{2}$/.test(v),
      "Use a UF com duas letras maiúsculas.",
    ),
    website: optionalUrl("website"),
    instagram: optionalUrl("instagram"),
    google_maps_url: optionalUrl("maps"),
    description: text(2000),
    services: text(2000),
    source: text(120),
    external_reference: text(255),
  })
  .strict()
  .refine((v) => !v.external_reference || !!v.source, {
    path: ["source"],
    message: "Informe a origem do identificador externo.",
  });
export type ImportLead = z.infer<typeof leadSchema>;
export type DraftLead = Omit<ImportLead, "niche"> & { niche: NicheId | "" };
export const fieldLabels: Record<keyof ImportLead, string> = {
  name: "Nome da empresa",
  niche: "Nicho",
  specialty: "Especialidade",
  google_category: "Categoria Google",
  segment: "Segmento",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  address: "Endereço",
  city: "Cidade",
  state: "UF",
  website: "Site",
  instagram: "Instagram",
  google_maps_url: "Google Maps",
  description: "Descrição",
  services: "Serviços",
  source: "Origem",
  external_reference: "Identificador externo",
};
export const fields = Object.keys(fieldLabels) as (keyof ImportLead)[];
export function blankLead(): DraftLead {
  return Object.fromEntries(fields.map((f) => [f, ""])) as DraftLead;
}
export function rowErrors(lead: DraftLead) {
  const result = leadSchema.safeParse(lead);
  return result.success
    ? []
    : result.error.issues.map((i) => ({
        field: String(i.path[0] ?? "registro"),
        message: i.message,
      }));
}
export function identityKeys(
  lead: Pick<
    DraftLead,
    | "name"
    | "phone"
    | "address"
    | "city"
    | "state"
    | "source"
    | "external_reference"
    | "google_maps_url"
  >,
): string[] {
  const keys: string[] = [];
  if (lead.source.trim() && lead.external_reference.trim())
    keys.push(
      `external:${lead.source.trim().toLowerCase()}:${lead.external_reference.trim()}`,
    );
  if (lead.google_maps_url.trim())
    keys.push(`maps:${normalizeMapsUrl(lead.google_maps_url)}`);
  const name = normalize(lead.name);
  const phone = lead.phone.replace(/\D/g, "");
  if (name && phone) keys.push(`phone:${name}:${phone}`);
  if (name && normalize(lead.address))
    keys.push(
      `address:${name}:${normalize(lead.address)}:${normalize(lead.city)}:${normalize(lead.state)}`,
    );
  return keys;
}
export function normalizeMapsUrl(value: string) {
  const raw = value.trim().split("#")[0];
  const queryIndex = raw.indexOf("?");
  const base = queryIndex < 0 ? raw : raw.slice(0, queryIndex);
  const query = queryIndex < 0 ? "" : raw.slice(queryIndex + 1);
  const normalizedBase = base
    .replace(
      /^https?:\/\/([^/]+)/i,
      (_, host: string) => `https://${host.toLowerCase()}`,
    )
    .replace(/\/+$/, "");
  const params = query
    .split("&")
    .filter(
      (p) => p && !/^(utm_.*|g_st|entry|hl|authuser)$/i.test(p.split("=")[0]),
    )
    .sort();
  return normalizedBase + (params.length ? `?${params.join("&")}` : "");
}
export function findFileDuplicates(
  rows: { row: number; lead: DraftLead; ignored?: boolean }[],
) {
  const seen = new Map<string, number>();
  const duplicates = new Map<number, number>();
  for (const row of rows) {
    const keys = [
      ...identityKeys(row.lead),
      `exact:${JSON.stringify(row.lead)}`,
    ];
    const first = keys.map((key) => seen.get(key)).find((v) => v !== undefined);
    if (first !== undefined) duplicates.set(row.row, first);
    if (!row.ignored)
      keys.forEach((key) => {
        if (!seen.has(key)) seen.set(key, row.row);
      });
  }
  return duplicates;
}
export type Decision = "insert" | "skip" | "update" | "separate";
export const importItemSchema = z
  .object({
    row: z.number().int().min(2).max(1000000),
    lead: leadSchema,
    decision: z.enum(["insert", "skip", "update", "separate"]),
    targetId: z.uuid().nullable(),
    targetUpdatedAt: z.string().max(50).nullable(),
    reason: text(500),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.decision === "update" && (!v.targetId || !v.targetUpdatedAt))
      ctx.addIssue({
        code: "custom",
        message: "Selecione o registro existente.",
        path: ["targetId"],
      });
    if (v.decision === "separate" && v.reason.length < 10)
      ctx.addIssue({
        code: "custom",
        message:
          "Justifique por que é uma empresa separada (mínimo 10 caracteres).",
        path: ["reason"],
      });
  });
export const importRequestSchema = z
  .object({
    requestId: z.uuid(),
    filename: text(255).min(1),
    totalRows: z.number().int().min(1).max(IMPORT_LIMITS.maxRows),
    rows: z.array(importItemSchema).min(1).max(IMPORT_LIMITS.maxRows),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.rows.length > v.totalRows ||
      new Set(v.rows.map((r) => r.row)).size !== v.rows.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Contagem ou identificação de linhas inválida.",
      });
  });
export type ImportRequest = z.infer<typeof importRequestSchema>;
export type DuplicateMatch = {
  id: string;
  name: string;
  niche: NicheId;
  address: string | null;
  phone: string | null;
  updated_at: string;
};
export type DuplicatePreview = { row: number; matches: DuplicateMatch[] };
export type ImportSummary = {
  id: string;
  status: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_code: string | null;
};
