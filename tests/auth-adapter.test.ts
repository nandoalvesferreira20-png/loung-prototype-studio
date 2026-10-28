import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import { supabaseAuthFlowPort } from "../src/lib/auth/auth-flow-port";
import { loginWithPassword } from "../src/lib/auth/flows";
import { diagnoseAuth } from "../src/lib/auth/diagnostics";
import { diagnosticFetch } from "../src/lib/supabase/transport";

const credentials = {
  email: "test@example.invalid",
  password: "private-password",
};
function client(
  error: unknown,
  admin: boolean | "error" = true,
  session = true,
) {
  let logouts = 0;
  const adapter = supabaseAuthFlowPort({
    auth: {
      signInWithPassword: async () => ({
        error,
        data: { user: { id: "u" }, session: session ? {} : null },
      }),
      getUser: async () => ({ data: { user: { id: "u" } }, error: null }),
      signOut: async () => {
        logouts++;
        return { error: null };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: admin === true ? { user_id: "u" } : null,
            error:
              admin === "error"
                ? { code: "42P01", message: "private database detail" }
                : null,
          }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>);
  return { adapter, logouts: () => logouts };
}

test("adapter: diferencia credenciais, confirmação, rate limit, API key e indisponibilidade", async () => {
  for (const error of [
    {
      code: "invalid_credentials",
      message: "Invalid login credentials",
      status: 400,
    },
    {
      code: "email_not_confirmed",
      message: "Email not confirmed",
      status: 400,
    },
    { code: "over_request_rate_limit", status: 429 },
    { message: "Invalid API key", status: 401 },
    { message: "fetch failed", status: 0 },
    { code: "unexpected_failure", status: 500 },
  ]) {
    const result = await loginWithPassword(client(error).adapter, credentials);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(
        result.message,
        error.code === "invalid_credentials"
          ? /Verifique seus dados/
          : /indisponível/,
      );
      assert.doesNotMatch(
        result.message,
        /email_not_confirmed|API key|private-password/,
      );
    }
  }
});

test("adapter: sessão completa e admin são necessários; erro SQL difere de associação ausente", async () => {
  assert.deepEqual(await loginWithPassword(client(null).adapter, credentials), {
    ok: true,
  });
  for (const admin of [false, "error"] as const) {
    const subject = client(null, admin);
    const result = await loginWithPassword(subject.adapter, credentials);
    assert.equal(result.ok, false);
    if (!result.ok)
      assert.match(
        result.message,
        admin === false ? /não possui acesso/ : /validar seu acesso/,
      );
    assert.equal(subject.logouts(), 1);
  }
  assert.equal(
    (await loginWithPassword(client(null, true, false).adapter, credentials))
      .ok,
    false,
  );
});

test("diagnóstico: não imprime erro bruto, credenciais, tokens nem mensagens arbitrárias", () => {
  const original = console.info;
  const records: unknown[][] = [];
  console.info = (...args) => {
    records.push(args);
  };
  try {
    diagnoseAuth("sign_in_failed", {
      code: "email_not_confirmed",
      status: 400,
      message: "private-password token=secret test@example.invalid",
      password: "private-password",
      access_token: "secret",
    });
    const output = JSON.stringify(records);
    assert.match(output, /email_not_confirmed/);
    assert.match(output, /400/);
    assert.doesNotMatch(output, /private-password|secret|test@example.invalid/);
  } finally {
    console.info = original;
  }
});

test("adapter: erro retornado não vira uma exceção genérica criada pela aplicação", async () => {
  const error = Object.assign(new Error("Email not confirmed"), {
    name: "AuthApiError",
    code: "email_not_confirmed",
    status: 400,
  });
  await assert.rejects(
    client(error).adapter.signIn(credentials),
    (actual) => actual === error,
  );
});

test("transporte: captura causa TLS antes do SDK, sem imprimir URL, headers ou payload", async () => {
  const original = console.info;
  const records: unknown[][] = [];
  console.info = (...args) => {
    records.push(args);
  };
  try {
    const cause = Object.assign(new Error("private certificate data"), {
      code: "SELF_SIGNED_CERT_IN_CHAIN",
    });
    const transport = diagnosticFetch(async () => {
      throw new TypeError("fetch failed", { cause });
    });
    await assert.rejects(
      transport("https://private.example.invalid", {
        headers: { Authorization: "Bearer secret-token" },
        body: "private-password",
      }),
      { name: "TypeError", message: "fetch failed" },
    );
    const output = JSON.stringify(records);
    assert.match(output, /transport_request_failed/);
    assert.match(output, /supabase.fetch/);
    assert.match(output, /TypeError/);
    assert.match(output, /SELF_SIGNED_CERT_IN_CHAIN/);
    assert.match(output, /untrusted self-signed certificate/);
    assert.doesNotMatch(
      output,
      /private certificate data|private.example|secret-token|private-password|Authorization/,
    );
  } finally {
    console.info = original;
  }
});

test("transporte: preserva requisição e resposta do Auth sem modificar dados", async () => {
  const response = new Response("{}", { status: 200 });
  const init = { method: "POST", body: "test-payload" };
  const transport = diagnosticFetch(async (input, options) => {
    assert.equal(input, "https://example.invalid/auth/v1/token");
    assert.equal(options, init);
    return response;
  });
  assert.equal(
    await transport("https://example.invalid/auth/v1/token", init),
    response,
  );
});

test("diagnóstico: erros desconhecidos não vazam campos; causas circulares têm limite", () => {
  const original = console.info;
  const records: unknown[][] = [];
  console.info = (...args) => {
    records.push(args);
  };
  try {
    const error: Record<string, unknown> = {
      name: "private-password",
      message: "secret-token",
      code: "test@example.invalid",
      status: NaN,
    };
    error.cause = error;
    diagnoseAuth("sign_in_exception", error, "auth.signInWithPassword");
    const output = JSON.stringify(records);
    assert.doesNotMatch(
      output,
      /private-password|secret-token|test@example.invalid/,
    );
    const detail = records[0][1] as { causes: unknown[] };
    assert.equal(detail.causes.length, 3);
  } finally {
    console.info = original;
  }
});
