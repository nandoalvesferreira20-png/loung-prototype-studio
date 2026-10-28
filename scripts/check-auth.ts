import { getSupabaseConfig } from "../src/config/supabase";
import { diagnosticFetch } from "../src/lib/supabase/transport";

// Verifica conexão e chave pública, sem efetuar login ou ler dados privados.
async function main() {
  const config = getSupabaseConfig();
  if (!config) {
    console.info("[auth:check]", { configuration: "missing_or_invalid" });
    process.exitCode = 1;
  } else {
    try {
      const response = await diagnosticFetch()(
        new URL("/auth/v1/settings", config.url),
        {
          headers: { apikey: config.publishableKey },
          signal: AbortSignal.timeout(10000),
        },
      );
      console.info("[auth:check]", {
        operation: "auth.settings",
        status: response.status,
        tlsVerification: "enabled",
      });
      if (!response.ok) process.exitCode = 1;
    } catch {
      console.info("[auth:check]", {
        operation: "auth.settings",
        result: "transport_failed",
      });
      process.exitCode = 1;
    }
  }
}
void main();
