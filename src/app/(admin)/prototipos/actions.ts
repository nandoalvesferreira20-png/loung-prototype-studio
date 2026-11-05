"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  previewGeneration,
  commitGeneration,
  editPrototype,
  generationFailure,
  GenerationError,
  type GenerationPort,
  type OperationResult,
} from "@/lib/generation/service";
import {
  leadFilterSchema,
  prototypeFilterSchema,
  type GenerationLeadPage,
  type PrototypePage,
} from "@/lib/generation/contracts";
import type { Json } from "@/types/database";
function fail(code: string): never {
  const safe = [
    "40001",
    "22023",
    "23505",
    "23514",
    "42501",
    "PGRST202",
    "57014",
    "55P03",
  ].includes(code)
    ? code
    : "database_error";
  console.error("[generation]", { code: safe });
  throw new GenerationError(safe);
}
function port(): GenerationPort {
  return {
    authorize: async () => {
      await requireAdmin();
    },
    plan: async (request) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client
        .rpc("plan_prototype_generation", {
          p_ids: request.leadIds,
          p_mode: request.mode,
        })
        .abortSignal(AbortSignal.timeout(20000));
      if (error) fail(error.code);
      return data;
    },
    replayExists: async (id) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client
        .from("prototype_generation_requests")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (error) fail(error.code);
      return !!data;
    },
    leads: async (ids) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client
        .from("leads")
        .select("*")
        .in("id", ids);
      if (error) fail(error.code);
      return data ?? [];
    },
    generate: async (request, customizations) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client
        .rpc("generate_prototypes", {
          p_request: { ...request, customizations } as unknown as Json,
        })
        .abortSignal(AbortSignal.timeout(20000));
      if (error) fail(error.code);
      return data;
    },
    edit: async (request) => {
      const client = await createServerSupabaseClient();
      const { error } = await client
        .rpc("edit_prototype", {
          p_id: request.id,
          p_revision: request.expectedRevision,
          p_template_id: request.templateId,
          p_data: request.personalization as unknown as Json,
        })
        .abortSignal(AbortSignal.timeout(20000));
      if (error) fail(error.code);
    },
  };
}
export async function previewGenerationAction(raw: unknown) {
  return previewGeneration(raw, port());
}
export async function generateAction(raw: unknown) {
  const result = await commitGeneration(raw, port());
  if (result.ok) {
    revalidatePath("/prototipos");
    revalidatePath("/dashboard");
  }
  return result;
}
export async function editPrototypeAction(raw: unknown) {
  const result = await editPrototype(raw, port());
  if (result.ok) {
    revalidatePath("/prototipos");
    revalidatePath("/publicacoes");
    revalidatePath("/dashboard");
  }
  return result;
}
export async function generationLeadsAction(
  raw: unknown,
): Promise<OperationResult<GenerationLeadPage>> {
  try {
    await requireAdmin();
    const filters = leadFilterSchema.parse(raw);
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc("list_generation_leads", {
      p_query: filters.query,
      p_niche: filters.niche,
      p_page: filters.page,
    });
    if (error) fail(error.code);
    return { ok: true, data: data as unknown as GenerationLeadPage };
  } catch (error) {
    return generationFailure(error);
  }
}
export async function selectAllGenerationAction(
  raw: unknown,
): Promise<OperationResult<string[]>> {
  try {
    await requireAdmin();
    const filters = leadFilterSchema.parse(raw);
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc("select_generation_leads", {
      p_query: filters.query,
      p_niche: filters.niche,
    });
    if (error) {
      if (error.code === "22023") throw new GenerationError("selection_limit");
      fail(error.code);
    }
    return { ok: true, data: data ?? [] };
  } catch (error) {
    return generationFailure(error);
  }
}
export async function prototypeListAction(
  raw: unknown,
): Promise<OperationResult<PrototypePage>> {
  try {
    await requireAdmin();
    const f = prototypeFilterSchema.parse(raw);
    const client = await createServerSupabaseClient();
    const { data, error } = await client.rpc("list_prototype_workspace", {
      p_query: f.query,
      p_niche: f.niche,
      p_status: f.status,
      p_template: f.templateId || null,
      p_page: f.page,
    });
    if (error) fail(error.code);
    const page = data as unknown as PrototypePage;
    if (page.items.length) {
      const publications = await client
        .from("published_prototypes")
        .select(
          "prototype_id,publication_version,source_revision,published_at,unpublished_at",
        )
        .in(
          "prototype_id",
          page.items.map((item) => item.id),
        );
      page.items = page.items.map((item) => ({
        ...item,
        publication:
          publications.data?.find((p) => p.prototype_id === item.id) ?? null,
        publicationUnavailable: !!publications.error,
      }));
    }
    return { ok: true, data: page };
  } catch (error) {
    return generationFailure(error);
  }
}
