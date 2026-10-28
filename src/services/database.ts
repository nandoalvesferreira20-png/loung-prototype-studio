import "server-only";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
// Não expõe um cliente sem guard e não faz fallback silencioso para dados de demonstração.
// Futuros métodos de escrita devem chamar requireAdmin() e continuam sujeitos a RLS/constraints.
async function authorizedClient() {
  await requireAdmin();
  return createServerSupabaseClient();
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
