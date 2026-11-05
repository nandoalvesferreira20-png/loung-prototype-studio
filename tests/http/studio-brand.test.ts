import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const base = process.env.TEST_PREVIEW_APP_URL;
test(
  "HTTP Studio: login uses official brand, local icon and administrative routes remain private",
  {
    skip: !base
      ? "Defina TEST_PREVIEW_APP_URL com o build local iniciado."
      : false,
  },
  async () => {
    const response = await fetch(new URL("/login", base));
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /studio-ui login-page/);
    assert.match(html, /LOUNG PROTOTYPE STUDIO/);
    assert.match(html, /Símbolo oficial LT/);
    assert.ok(html.includes('href="/assets/brand/loung-tech-lt.png"'));
    assert.doesNotMatch(html, /class="brand-symbol"|>Criar conta</);
    const icon = await fetch(new URL("/assets/brand/loung-tech-lt.png", base));
    assert.equal(icon.status, 200);
    assert.deepEqual(
      Buffer.from(await icon.arrayBuffer()),
      readFileSync("src/data/logo.png"),
    );
    for (const path of [
      "/dashboard",
      "/importacoes",
      "/prototipos",
      "/publicacoes",
      "/templates",
      "/configuracoes",
    ]) {
      const page = await fetch(new URL(path, base), { redirect: "manual" });
      assert.equal(page.status, 307, path);
      assert.match(page.headers.get("location") ?? "", /^\/login/);
      assert.match(page.headers.get("cache-control") ?? "", /no-store/);
    }
  },
);
