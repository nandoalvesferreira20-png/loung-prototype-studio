"use server";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  centerFilters,
  initialCenterFilters,
  publicationIds,
  type CenterPage,
  type SharedPublication,
} from "@/lib/publication-center";
import { publicBaseUrl, publicLink } from "@/lib/publication";
import { niches } from "@/config/catalog";
import type { Json } from "@/types/database";
export async function listPublications(raw: unknown) {
  try {
    await requireAdmin();
    const filters = centerFilters.parse(raw);
    const db = await createServerSupabaseClient();
    const { data, error } = await db
      .rpc("list_publication_center", { p_filters: filters as unknown as Json })
      .abortSignal(AbortSignal.timeout(20000));
    if (error) throw error;
    let base: string | null = null;
    try {
      base = publicBaseUrl();
    } catch {
      /* show configuration warning */
    }
    return { ok: true as const, data: data as unknown as CenterPage, base };
  } catch {
    return {
      ok: false as const,
      error:
        "Não foi possível consultar a Central. Verifique acesso administrativo e a migration da fase 5.2.",
    };
  }
}
export async function sharingPublications(raw: unknown) {
  try {
    await requireAdmin();
    const ids = publicationIds.parse(raw);
    const base = publicBaseUrl();
    const result = await listPublications({
      ...initialCenterFilters,
      ids,
      state: "published",
    });
    if (!result.ok) throw new Error("unavailable");
    const rows: SharedPublication[] = result.data.items.map((item) => ({
      company: item.public_name ?? "Demonstração",
      niche: niches.find((n) => n.id === item.niche)?.name ?? item.niche,
      template: `${item.template_name} · ${item.variant}`,
      status: "Publicado",
      url: publicLink(base, item.slug),
      publishedAt: item.published_at ?? "",
    }));
    const publications = result.data.items.map((item, index) => ({
      id: item.id,
      company: rows[index].company,
      url: rows[index].url,
    }));
    return {
      ok: true as const,
      rows,
      publications,
      omitted: ids.length - rows.length,
    };
  } catch {
    return {
      ok: false as const,
      error:
        "Links indisponíveis. Verifique autorização, publicações ativas e STUDIO_PUBLIC_URL.",
    };
  }
}
