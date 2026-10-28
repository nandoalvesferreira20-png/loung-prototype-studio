"use server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/config/supabase";
import { supabaseAuthFlowPort } from "@/lib/auth/auth-flow-port";
import { diagnoseAuth } from "@/lib/auth/diagnostics";
import {
  loginWithPassword,
  logoutSession,
  parseCredentials,
} from "@/lib/auth/flows";
export type AuthFormState = { message: string };
export async function loginAction(
  _previous: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  void _previous;
  if (!getSupabaseConfig()) {
    diagnoseAuth("configuration_missing_or_invalid");
    return {
      message:
        "O acesso ainda não foi configurado. Entre em contato com a Loung Tech.",
    };
  }
  const credentials = parseCredentials(form);
  if (!credentials) return { message: "Informe um e-mail válido e sua senha." };
  try {
    diagnoseAuth(
      "server_client_creating",
      undefined,
      "loginAction.createServerSupabaseClient",
    );
    const client = await createServerSupabaseClient(true);
    diagnoseAuth(
      "server_client_created",
      undefined,
      "loginAction.createServerSupabaseClient",
    );
    const result = await loginWithPassword(
      supabaseAuthFlowPort(client),
      credentials,
    );
    if (!result.ok) return { message: result.message };
  } catch (error) {
    diagnoseAuth(
      "login_action_failed",
      error,
      "loginAction.createServerSupabaseClient",
    );
    return {
      message:
        "O serviço de acesso está indisponível. Tente novamente em instantes.",
    };
  }
  // Destino fixo: não aceita redirect arbitrário vindo do cliente.
  redirect("/dashboard");
}
export async function logoutAction(
  _previous: AuthFormState,
  _form: FormData,
): Promise<AuthFormState> {
  void _previous;
  void _form;
  if (!getSupabaseConfig())
    return {
      message: "Não foi possível acessar o serviço para encerrar a sessão.",
    };
  try {
    const result = await logoutSession(
      supabaseAuthFlowPort(await createServerSupabaseClient(true)),
    );
    if (!result.ok) return { message: result.message };
  } catch {
    return { message: "Não foi possível encerrar a sessão. Tente novamente." };
  }
  redirect("/login");
}
