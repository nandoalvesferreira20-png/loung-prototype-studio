import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { supabaseAccessPort } from "./supabase-port";
import type { AuthFlowPort } from "./flows";
import { diagnoseAuth } from "./diagnostics";
export function supabaseAuthFlowPort(
  client: SupabaseClient<Database>,
): AuthFlowPort {
  return {
    ...supabaseAccessPort(client),
    async signIn(credentials) {
      diagnoseAuth("sign_in_started", undefined, "auth.signInWithPassword");
      let result: Awaited<ReturnType<typeof client.auth.signInWithPassword>>;
      try {
        result = await client.auth.signInWithPassword(credentials);
      } catch (error) {
        diagnoseAuth("sign_in_exception", error, "auth.signInWithPassword");
        throw error;
      }
      const { data, error } = result;
      if (error) {
        diagnoseAuth(
          "sign_in_failed",
          error,
          "auth.signInWithPassword.response",
        );
        if (error.code === "invalid_credentials") return false;
        throw error;
      }
      if (!data.user || !data.session) {
        diagnoseAuth(
          "sign_in_missing_session",
          undefined,
          "auth.signInWithPassword.response",
        );
        throw new Error("Sessão não estabelecida.");
      }
      diagnoseAuth("sign_in_succeeded");
      return true;
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) diagnoseAuth("sign_out_failed", error);
      return !error;
    },
  };
}
