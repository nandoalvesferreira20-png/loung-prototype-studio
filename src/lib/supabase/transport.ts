import { diagnoseAuth } from "../auth/diagnostics";

// O SDK converte falhas de fetch e perde error.cause. Inspecionar antes dessa conversão.
export function diagnosticFetch(
  fetcher: typeof fetch = globalThis.fetch,
): typeof fetch {
  return async (input, init) => {
    try {
      return await fetcher(input, init);
    } catch (error) {
      diagnoseAuth("transport_request_failed", error, "supabase.fetch");
      // O SDK pode imprimir o erro recebido; não repassar dados arbitrários do transporte.
      throw new TypeError("fetch failed");
    }
  };
}
