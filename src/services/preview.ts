import "server-only";
import { requireAdminPage } from "@/lib/auth/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { loadPrivatePreview } from "@/lib/prototype-preview";
export async function getPrivatePreview(id: string) {
  return loadPrivatePreview(id, {
    authorize: requireAdminPage,
    prototype: async (key) => {
      const db = await createServerSupabaseClient();
      const { data, error } = await db
        .from("prototypes")
        .select("*")
        .eq("id", key)
        .maybeSingle();
      if (error) throw new Error("preview_read_failed");
      return data;
    },
    template: async (key) => {
      const db = await createServerSupabaseClient();
      const { data, error } = await db
        .from("templates")
        .select("*")
        .eq("id", key)
        .maybeSingle();
      if (error) throw new Error("preview_template_read_failed");
      return data;
    },
  });
}
