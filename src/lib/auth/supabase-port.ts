import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { AccessPort } from "./access";
import { diagnoseAuth } from "./diagnostics";

export function supabaseAccessPort(
  client: SupabaseClient<Database>,
): AccessPort {
  return {
    async currentUser() {
      // Consulta o Auth servidor: também detecta sessão revogada/usuário removido.
      const { data, error } = await client.auth.getUser();
      if (error) {
        diagnoseAuth("session_validation_failed", error, "auth.getUser");
        if (
          error.name === "AuthSessionMissingError" ||
          error.status === 401 ||
          error.status === 403 ||
          error.code === "refresh_token_not_found" ||
          error.code === "refresh_token_already_used"
        )
          return null;
        throw new Error("Não foi possível validar a sessão.");
      }
      return data.user ? { id: data.user.id, email: data.user.email } : null;
    },
    async isAdmin(userId) {
      const { data, error } = await client
        .from("admin_users")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        diagnoseAuth("admin_lookup_failed", error, "admin_users.select");
        throw new Error("Não foi possível consultar a autorização.");
      }
      diagnoseAuth(
        data?.user_id === userId ? "admin_authorized" : "admin_forbidden",
        undefined,
        "admin_users.select",
      );
      return data?.user_id === userId;
    },
  };
}
