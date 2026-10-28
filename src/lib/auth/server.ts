import "server-only";
import { redirect } from "next/navigation";
import { getSupabaseConfig } from "@/config/supabase";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertAdminAccess, resolveAccess, type AccessResult } from "./access";
import { supabaseAccessPort } from "./supabase-port";

export async function getAdminAccess(): Promise<AccessResult> {
  if (!getSupabaseConfig()) return { status: "unavailable" };
  try {
    return await resolveAccess(
      supabaseAccessPort(await createServerSupabaseClient()),
    );
  } catch {
    return { status: "unavailable" };
  }
}
// Para Server Actions/Route Handlers/repositórios: lança erro, nunca executa uma operação sem autorização.
export async function requireAdmin() {
  const access = await getAdminAccess();
  assertAdminAccess(access);
  return access.user;
}
// Para páginas: valida novamente no servidor, mesmo em navegações que reutilizem o layout.
export async function requireAdminPage() {
  const access = await getAdminAccess();
  if (access.status !== "authorized") {
    const reason =
      access.status === "unauthenticated" ? "" : `?reason=${access.status}`;
    redirect(`/login${reason}`);
  }
  return access.user;
}
