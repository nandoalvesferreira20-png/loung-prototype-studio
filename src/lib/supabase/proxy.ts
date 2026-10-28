import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/config/supabase";
import type { Database } from "@/types/database";
import { diagnosticFetch } from "./transport";
import { diagnoseAuth } from "../auth/diagnostics";

// Somente renovação. Autorização é obrigatória nas páginas, ações e acesso aos dados.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  const config = getSupabaseConfig();
  if (!config) return response;
  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      global: { fetch: diagnosticFetch() },
      cookieOptions: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          response.headers.set("Cache-Control", "private, no-store");
        },
      },
    },
  );
  try {
    const { error } = await supabase.auth.getClaims();
    if (error)
      diagnoseAuth("proxy_claims_failed", error, "proxy.auth.getClaims");
  } catch (error) {
    diagnoseAuth("proxy_claims_exception", error, "proxy.auth.getClaims");
    /* O guard do servidor nega acesso se Auth estiver indisponível. */
  }
  return response;
}
