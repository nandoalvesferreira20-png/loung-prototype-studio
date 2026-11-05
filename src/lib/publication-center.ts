import { z } from "zod";
import type { NicheId } from "../types/domain";
export const PUBLICATION_BATCH_LIMIT = 25;
export const publicationIds = z
  .array(z.uuid())
  .min(1)
  .max(PUBLICATION_BATCH_LIMIT)
  .refine((ids) => new Set(ids).size === ids.length);
export const centerFilters = z
  .object({
    query: z.string().trim().max(100),
    niche: z.enum([
      "",
      "clinicas",
      "advocacia",
      "imobiliarias",
      "restaurantes",
    ]),
    template: z.union([z.uuid(), z.literal("")]),
    state: z.enum(["", "never", "published", "unpublished"]),
    pending: z.enum(["", "yes", "no"]),
    sort: z.enum(["updated", "name", "published"]),
    page: z.number().int().min(0).max(100000),
    ids: publicationIds.optional(),
  })
  .strict();
export type CenterFilters = z.infer<typeof centerFilters>;
export const initialCenterFilters: CenterFilters = {
  query: "",
  niche: "",
  template: "",
  state: "",
  pending: "",
  sort: "updated",
  page: 0,
};
export type PublicationItem = {
  id: string;
  name: string;
  niche: NicheId;
  template_id: string;
  template_name: string;
  variant: "A" | "B";
  revision: number;
  updated_at: string;
  slug: string;
  state: "never" | "published" | "unpublished";
  pending: boolean;
  publication_version: number | null;
  source_revision: number | null;
  published_at: string | null;
  public_name: string | null;
};
export type CenterPage = {
  items: PublicationItem[];
  total: number;
  metrics: {
    total: number;
    never: number;
    published: number;
    pending: number;
    unpublished: number;
  };
};
export type SharedPublication = {
  company: string;
  niche: string;
  template: string;
  status: string;
  url: string;
  publishedAt: string;
};
export function linksCsv(rows: SharedPublication[]) {
  const cell = (value: string) => {
    const safe =
      /^[\s\uFEFF]*[=+\-@]/.test(value) || /^[\t\r\n]/.test(value)
        ? `'${value}`
        : value;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      [
        "Empresa",
        "Nicho",
        "Template",
        "Status",
        "URL pública",
        "Data da publicação",
      ],
      ...rows.map((r) => [
        r.company,
        r.niche,
        r.template,
        r.status,
        r.url,
        r.publishedAt,
      ]),
    ]
      .map((row) => row.map(cell).join(";"))
      .join("\r\n")
  );
}
export function updateSelection(
  current: PublicationItem[],
  items: PublicationItem[],
  checked: boolean,
) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of items) {
    if (checked) map.set(item.id, item);
    else map.delete(item.id);
  }
  if (map.size > PUBLICATION_BATCH_LIMIT)
    throw new Error("Selecione até 25 protótipos por execução.");
  return [...map.values()];
}
export type ItemOutcome = { id: string; ok: boolean; error?: string };
// Orchestration only: the provided operation is the existing authorized individual action.
export async function processPublicationItems<T extends { id: string }>(
  items: T[],
  operation: (item: T) => Promise<{ ok: boolean; error?: string }>,
  progress: (results: ItemOutcome[]) => void,
) {
  publicationIds.parse(items.map((item) => item.id));
  const results: ItemOutcome[] = [];
  for (const item of items) {
    try {
      results.push({ id: item.id, ...(await operation(item)) });
    } catch {
      results.push({
        id: item.id,
        ok: false,
        error:
          "Resposta não confirmada. Consulte o estado atual e revise antes de tentar novamente.",
      });
    }
    progress([...results]);
  }
  return results;
}
