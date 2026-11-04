"use server";
import { z } from "zod";
import publicationAssets from "@/config/publication-assets.json";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  publicSnapshot,
  publicDataSchema,
  publicBaseUrl,
  publicLink,
} from "@/lib/publication";
import { templateRenderers } from "@/templates/registry";
import type { Json } from "@/types/database";

async function assets(value: unknown): Promise<void> {
  if (typeof value === "string" && value.startsWith("/templates/")) {
    if (
      !/^\/templates\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/.test(
        value,
      )
    )
      throw new Error("Referência de imagem inválida.");
    if (!publicationAssets.includes(value))
      throw new Error("Imagem não encontrada.");
  } else if (Array.isArray(value)) {
    for (const child of value) await assets(child);
  } else if (value && typeof value === "object") {
    for (const child of Object.values(value)) await assets(child);
  }
}
export async function reviewPublication(id: string) {
  try {
    await requireAdmin();
    z.uuid().parse(id);
    const db = await createServerSupabaseClient();
    const { data: proto, error } = await db
      .from("prototypes")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !proto) throw new Error("Protótipo indisponível.");
    const { data: template } = await db
      .from("templates")
      .select("*")
      .eq("id", proto.template_id)
      .single();
    if (
      !template ||
      template.status !== "active" ||
      template.niche !== proto.niche ||
      !(template.slug in templateRenderers)
    )
      throw new Error("Template indisponível.");
    const snapshot = publicSnapshot(proto.customization_data);
    await assets(snapshot);
    const { data: publication, error: publicationError } = await db
      .from("published_prototypes")
      .select("*")
      .eq("prototype_id", id)
      .maybeSingle();
    if (publicationError)
      throw new Error(
        "Publicação indisponível. Verifique a migration da fase 5.1.",
      );
    let url: string | null = null;
    try {
      url = publicLink(publicBaseUrl(), proto.slug);
    } catch {
      /* publication remains reviewable */
    }
    return {
      ok: true as const,
      data: {
        id,
        revision: proto.revision,
        template: template.name,
        slug: proto.slug,
        snapshot,
        publication,
        url,
        warnings: [
          "A confirmação autoriza todos os textos, serviços, contatos, imagens, profissionais e catálogos exibidos abaixo.",
          "Imagens ilustrativas e conteúdo conceitual devem permanecer identificados.",
          ...Object.entries(snapshot.confirmed)
            .filter(
              ([, value]) =>
                value === null || (Array.isArray(value) && !value.length),
            )
            .map(([key]) => `Campo não informado: ${key}.`),
          ...(!url
            ? ["Configure STUDIO_PUBLIC_URL para gerar links compartilháveis."]
            : []),
        ],
      },
    };
  } catch {
    return {
      ok: false as const,
      error:
        "Não foi possível revisar. Verifique autorização, dados, imagens e migration de publicação.",
    };
  }
}
const commitSchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().positive(),
    version: z.number().int().nonnegative(),
    snapshot: publicDataSchema,
    approved: z.literal(true),
  })
  .strict();
export async function publishPrototype(raw: unknown) {
  try {
    await requireAdmin();
    const input = commitSchema.parse(raw);
    const reviewed = await reviewPublication(input.id);
    if (
      !reviewed.ok ||
      reviewed.data.revision !== input.revision ||
      JSON.stringify(reviewed.data.snapshot) !== JSON.stringify(input.snapshot)
    )
      throw new Error("changed");
    const db = await createServerSupabaseClient();
    const { error } = await db.rpc("publish_prototype", {
      p_id: input.id,
      p_revision: input.revision,
      p_version: input.version,
      p_data: input.snapshot as unknown as Json,
    });
    if (error) throw error;
    revalidatePath(`/p/${reviewed.data.slug}`);
    revalidatePath("/prototipos");
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error:
        "Publicação recusada. Revise novamente: os dados ou a versão podem ter mudado.",
    };
  }
}
export async function unpublishPrototype(id: string, version: number) {
  try {
    await requireAdmin();
    z.uuid().parse(id);
    z.number().int().positive().parse(version);
    const db = await createServerSupabaseClient();
    const { data: publication } = await db
      .from("published_prototypes")
      .select("slug")
      .eq("prototype_id", id)
      .single();
    if (!publication) throw new Error("unavailable");
    const { error } = await db.rpc("unpublish_prototype", {
      p_id: id,
      p_version: version,
    });
    if (error) throw error;
    revalidatePath(`/p/${publication.slug}`);
    revalidatePath("/prototipos");
    return { ok: true as const };
  } catch {
    return {
      ok: false as const,
      error:
        "Não foi possível despublicar. Atualize a revisão e tente novamente.",
    };
  }
}
