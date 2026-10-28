import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AccessDeniedError,
  assertAdminAccess,
  resolveAccess,
} from "../src/lib/auth/access";
import {
  loginWithPassword,
  logoutSession,
  parseCredentials,
  type AuthFlowPort,
} from "../src/lib/auth/flows";
// Testes unitários com portas em memória. Não comprovam conexão/Auth/RLS do Supabase.
function port(
  options: {
    signedIn?: boolean;
    admin?: boolean;
    validPassword?: boolean;
    unavailable?: boolean;
    logoutFailure?: boolean;
  } = {},
) {
  let signedIn = options.signedIn ?? false;
  let logouts = 0;
  const adapter: AuthFlowPort = {
    async currentUser() {
      if (options.unavailable) throw new Error("offline");
      return signedIn ? { id: "user-1", email: "test@example.invalid" } : null;
    },
    async isAdmin() {
      return options.admin ?? false;
    },
    async signIn() {
      signedIn = options.validPassword ?? true;
      return signedIn;
    },
    async signOut() {
      logouts++;
      if (options.logoutFailure) return false;
      signedIn = false;
      return true;
    },
  };
  return { adapter, logouts: () => logouts };
}
test("unitário: sessão ausente é negada sem consultar associação", async () => {
  const result = await resolveAccess({
    currentUser: async () => null,
    isAdmin: async () => {
      throw new Error("não deve chamar");
    },
  });
  assert.equal(result.status, "unauthenticated");
});
test("unitário: usuário autenticado sem associação não é administrador", async () => {
  assert.equal(
    (await resolveAccess(port({ signedIn: true }).adapter)).status,
    "forbidden",
  );
});
test("unitário: administrador explícito é autorizado", async () => {
  const access = await resolveAccess(
    port({ signedIn: true, admin: true }).adapter,
  );
  assertAdminAccess(access);
  assert.equal(access.user.id, "user-1");
});
test("unitário: falha de infraestrutura nega acesso", async () => {
  assert.equal(
    (
      await resolveAccess(
        port({ signedIn: true, admin: true, unavailable: true }).adapter,
      )
    ).status,
    "unavailable",
  );
});
test("unitário: guard impede operação em todos os estados negados", () => {
  for (const status of [
    "unauthenticated",
    "forbidden",
    "unavailable",
  ] as const) {
    let calls = 0;
    assert.throws(() => {
      assertAdminAccess({ status });
      calls++;
    }, AccessDeniedError);
    assert.equal(calls, 0);
  }
});
test("unitário: login válido requer senha e autorização", async () => {
  assert.deepEqual(
    await loginWithPassword(port({ admin: true }).adapter, {
      email: "test@example.invalid",
      password: "test-password",
    }),
    { ok: true },
  );
});
test("unitário: login inválido mostra erro genérico sem autorizar", async () => {
  const result = await loginWithPassword(
    port({ validPassword: false }).adapter,
    { email: "test@example.invalid", password: "wrong" },
  );
  assert.equal(result.ok, false);
});
test("unitário: login de não administrador encerra a sessão recém-aberta", async () => {
  const client = port();
  const result = await loginWithPassword(client.adapter, {
    email: "test@example.invalid",
    password: "test-password",
  });
  assert.equal(result.ok, false);
  assert.equal(client.logouts(), 1);
  assert.equal((await resolveAccess(client.adapter)).status, "unauthenticated");
});
test("unitário: logout encerra sessão e falha não indica sucesso", async () => {
  const client = port({ signedIn: true, admin: true });
  assert.deepEqual(await logoutSession(client.adapter), { ok: true });
  assert.equal((await resolveAccess(client.adapter)).status, "unauthenticated");
  assert.equal(
    (await logoutSession(port({ signedIn: true, logoutFailure: true }).adapter))
      .ok,
    false,
  );
});
test("unitário: credenciais malformadas são rejeitadas e senha não é trimada", () => {
  const form = new FormData();
  assert.equal(parseCredentials(form), null);
  form.set("email", "invalid");
  form.set("password", "password");
  assert.equal(parseCredentials(form), null);
  form.set("email", " test@example.invalid ");
  form.set("password", " password ");
  assert.deepEqual(parseCredentials(form), {
    email: "test@example.invalid",
    password: " password ",
  });
});
