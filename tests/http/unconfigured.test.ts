import { test } from "node:test";
import assert from "node:assert/strict";
const url = process.env.TEST_APP_URL;
test(
  "HTTP sem configuração: login informativo e acesso privado bloqueado",
  {
    skip: !url
      ? "Inicie a aplicação sem Supabase e defina TEST_APP_URL."
      : false,
  },
  async () => {
    assert.ok(url);
    const login = await fetch(new URL("/login", url));
    assert.equal(login.status, 200);
    const html = await login.text();
    assert.ok(html.includes("aguardando configuração do Supabase"));
    assert.doesNotMatch(html, />Criar conta</);
    for (const path of [
      "/dashboard",
      "/importacoes",
      "/prototipos",
      "/templates",
      "/configuracoes",
    ]) {
      const response: Response = await fetch(new URL(path, url), {
        redirect: "manual",
      });
      assert.equal(response.status, 307);
      assert.ok(
        response.headers.get("location")?.includes("/login?reason=unavailable"),
      );
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    }
    const api = await fetch(new URL("/api/admin/session", url));
    assert.equal(api.status, 503);
    assert.deepEqual(await api.json(), {
      error: "Acesso administrativo indisponível ou não autorizado.",
    });
  },
);
