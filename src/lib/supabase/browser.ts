"use client";
import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseConfig } from "@/config/supabase";
import type { Database } from "@/types/database";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, publishableKey);
}
