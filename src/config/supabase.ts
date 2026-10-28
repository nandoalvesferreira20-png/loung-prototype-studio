export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

// Referências explícitas permitem ao Next.js disponibilizar apenas estas variáveis no cliente.
export function getSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey || !publishableKey.startsWith("sb_publishable_"))
    return null;
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:"))
      return null;
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    )
      return null;
    return { url: parsed.origin, publishableKey };
  } catch {
    return null;
  }
}

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();
  if (!config)
    throw new Error(
      "Supabase não configurado: verifique URL e chave publicável.",
    );
  return config;
}
