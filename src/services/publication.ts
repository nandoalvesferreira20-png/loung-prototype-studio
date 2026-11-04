import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/config/supabase";
import type { Database } from "@/types/database";
import { publicDataSchema, slugSchema } from "@/lib/publication";
export async function getPublicSite(slug: string) {
  if (!slugSchema.safeParse(slug).success) return null;
  const config = getSupabaseConfig();
  if (!config) return null;
  // No cookies, session, service key, or private-table access in the public read path.
  const db = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error } = await db
    .from("published_prototypes")
    .select("slug,template_identifier,public_data")
    .eq("slug", slug)
    .is("unpublished_at", null)
    .maybeSingle();
  if (error || !data) return null;
  const parsed = publicDataSchema.safeParse(data.public_data);
  return parsed.success ? { ...data, public_data: parsed.data } : null;
}
