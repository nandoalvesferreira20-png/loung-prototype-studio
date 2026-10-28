// Apenas metadados controlados; nunca imprimir objetos, URLs, stacks ou payloads.
const messages = new Map([
  ["Invalid login credentials", "Invalid login credentials"],
  ["Email not confirmed", "Email not confirmed"],
  ["Invalid API key", "Invalid API key"],
  ["fetch failed", "fetch failed"],
  ["Failed to fetch", "Failed to fetch"],
  ["Falha no serviço de autenticação.", "Application replaced Auth error"],
  ["Sessão não estabelecida.", "Auth response has no complete session"],
  [
    "Cookies can only be modified in a Server Action or Route Handler.",
    "Cookie write outside Server Action or Route Handler",
  ],
]);
const transportCodes = new Map([
  [
    "SELF_SIGNED_CERT_IN_CHAIN",
    "TLS certificate chain contains an untrusted self-signed certificate",
  ],
  [
    "DEPTH_ZERO_SELF_SIGNED_CERT",
    "TLS peer uses an untrusted self-signed certificate",
  ],
  [
    "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    "TLS certificate issuer could not be verified",
  ],
  [
    "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
    "TLS issuer is not in the local trust store",
  ],
  ["CERT_HAS_EXPIRED", "TLS certificate has expired"],
  ["ERR_TLS_CERT_ALTNAME_INVALID", "TLS certificate hostname mismatch"],
  ["ENOTFOUND", "DNS lookup failed"],
  ["ECONNREFUSED", "Connection refused"],
  ["ECONNRESET", "Connection reset"],
  ["ETIMEDOUT", "Connection timed out"],
  ["UND_ERR_CONNECT_TIMEOUT", "Connection timed out"],
]);
const names = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "DOMException",
  "AbortError",
  "TimeoutError",
  "AuthApiError",
  "AuthRetryableFetchError",
  "AuthUnknownError",
  "AuthSessionMissingError",
  "AuthInvalidTokenResponseError",
]);
const codes = new Set([
  "invalid_credentials",
  "email_not_confirmed",
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "unexpected_failure",
  "request_timeout",
  "email_provider_disabled",
  "user_banned",
  "captcha_failed",
  "bad_jwt",
  "session_not_found",
  "session_expired",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "42P01",
  "42501",
  "PGRST116",
  "PGRST205",
  ...transportCodes.keys(),
]);

function safeDetail(error: unknown) {
  const detail =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : {};
  const code =
    typeof detail.code === "string" && codes.has(detail.code)
      ? detail.code
      : "unknown";
  return {
    name:
      typeof detail.name === "string" && names.has(detail.name)
        ? detail.name
        : "UnknownError",
    type: error === null ? "null" : typeof error,
    code,
    status:
      typeof detail.status === "number" &&
      Number.isInteger(detail.status) &&
      detail.status >= 0 &&
      detail.status <= 599
        ? detail.status
        : null,
    message:
      transportCodes.get(code) ??
      (typeof detail.message === "string"
        ? messages.get(detail.message)
        : undefined) ??
      "Unrecognized message omitted; inspect safe code and operation",
  };
}

export function diagnoseAuth(
  stage: string,
  error?: unknown,
  origin = "auth.access",
) {
  if (typeof window !== "undefined" || process.env.NODE_ENV === "production")
    return;
  if (error === undefined) {
    console.info("[auth]", { stage, origin });
    return;
  }
  const causes = [];
  let nested: unknown = error;
  for (let depth = 0; depth < 3; depth++) {
    if (!nested || typeof nested !== "object" || !("cause" in nested)) break;
    nested = nested.cause;
    causes.push(safeDetail(nested));
  }
  console.info("[auth]", { stage, origin, ...safeDetail(error), causes });
}
