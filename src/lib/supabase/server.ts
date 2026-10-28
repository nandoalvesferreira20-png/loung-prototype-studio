import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseConfig } from "@/config/supabase";
import type { Database } from "@/types/database";
import { diagnoseAuth } from "@/lib/auth/diagnostics";
import { diagnosticFetch } from "./transport";

// Cliente por requisição: nunca compartilhar sessão em uma variável de módulo.
export async function createServerSupabaseClient(requireCookieWrites = false) {
  const { url, publishableKey } = requireSupabaseConfig();
  const cookieStore = await cookies();
  return createServerClient<Database>(url, publishableKey, {
    global: { fetch: diagnosticFetch() },
    cookieOptions: {
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch (error) {
          diagnoseAuth(
            "session_cookie_write_failed",
            error,
            "server.cookies.setAll",
          );
          if (requireCookieWrites) throw error;
          // Server Components não gravam cookies. O proxy renova a sessão antes da renderização.
          // Em Server Actions/Route Handlers o cookieStore permite a gravação.
        }
      },
    },
  });
}
