import "server-only";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
// Não expõe um cliente sem guard e não faz fallback silencioso para dados de demonstração.
// Futuros métodos de escrita devem chamar requireAdmin() e continuam sujeitos a RLS/constraints.
async function authorizedClient() {
  await requireAdmin();
  return createServerSupabaseClient();
}
export async function getDashboardData() {
  const client = await authorizedClient();
  const [
    leads,
    prototypes,
    published,
    drafts,
    review,
    imports,
    latest,
    ...distribution
  ] = await Promise.all([
    client.from("leads").select("id", { count: "exact", head: true }),
    client.from("prototypes").select("id", { count: "exact", head: true }),
    client
      .from("published_prototypes")
      .select("prototype_id", { count: "exact", head: true })
      .is("unpublished_at", null),
    client
      .from("prototypes")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    client
      .from("prototypes")
      .select("id", { count: "exact", head: true })
      .eq("status", "review"),
    client.from("imports").select("id", { count: "exact", head: true }),
    client
      .from("imports")
      .select("created_at")
      .in("status", ["completed", "partial"])
      .order("created_at", { ascending: false })
      .limit(1),
    ...(["clinicas", "advocacia", "imobiliarias", "restaurantes"] as const).map(
      (n) =>
        client
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("niche", n),
    ),
  ]);
  if (
    [
      leads,
      prototypes,
      published,
      drafts,
      review,
      imports,
      latest,
      ...distribution,
    ].some((r) => r.error)
  )
    throw new Error("Não foi possível consultar os indicadores do banco.");
  return {
    leads: leads.count ?? 0,
    prototypes: prototypes.count ?? 0,
    published: published.count ?? 0,
    drafts: Math.max(0, (drafts.count ?? 0) - (published.count ?? 0)),
    review: review.count ?? 0,
    imports: imports.count ?? 0,
    latestImport: latest.data?.[0]?.created_at ?? null,
    distribution: distribution.map((r) => r.count ?? 0),
  };
}
export async function listPersistedTemplates() {
  const client = await authorizedClient();
  const { data, error } = await client
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    throw new Error("Não foi possível consultar o catálogo persistido.");
  return data;
}
export async function listPersistedLeads() {
  const client = await authorizedClient();
  const { data, error } = await client
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    throw new Error("Não foi possível consultar os registros persistidos.");
  return data;
}
export async function listPersistedImports() {
  const client = await authorizedClient();
  const { data, error } = await client
    .from("imports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    throw new Error("Não foi possível consultar as importações persistidas.");
  return data;
}
export async function listPersistedPrototypes() {
  const client = await authorizedClient();
  const { data, error } = await client
    .from("prototypes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error)
    throw new Error("Não foi possível consultar os protótipos persistidos.");
  return data;
}
