"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { executeImport, type ImportPort } from "@/lib/imports/service";
import type { DuplicatePreview, ImportSummary } from "@/lib/imports/model";
import type { Json } from "@/types/database";

function port(): ImportPort {
  return {
    authorize: async () => {
      await requireAdmin();
    },
    preview: async (request) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client.rpc("preview_lead_import", {
        p_rows: request.rows as unknown as Json,
      });
      if (error) {
        console.error("[imports]", {
          operation: "preview",
          code: /^[A-Z0-9]{5,8}$/.test(error.code)
            ? error.code
            : "database_error",
        });
        throw new Error("Import preview failed");
      }
      return data as unknown as DuplicatePreview[];
    },
    commit: async (request) => {
      const client = await createServerSupabaseClient();
      const { data, error } = await client.rpc("commit_lead_import", {
        p_request: request as unknown as Json,
      });
      if (error) {
        console.error("[imports]", {
          operation: "commit",
          code: /^[A-Z0-9]{5,8}$/.test(error.code)
            ? error.code
            : "database_error",
        });
        throw new Error("Import transaction failed");
      }
      return data as unknown as ImportSummary;
    },
  };
}
export async function previewImportAction(request: unknown) {
  return executeImport(request, "preview", port());
}
export async function commitImportAction(request: unknown) {
  const result = await executeImport(request, "commit", port());
  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/importacoes");
  }
  return result;
}
