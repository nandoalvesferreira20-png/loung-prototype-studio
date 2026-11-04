import { test } from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_PREVIEW_APP_URL;
test(
  "HTTP prévia: visitante não recebe personalização; slug não publicado retorna 404",
  {
    skip: !base
      ? "Defina TEST_PREVIEW_APP_URL com a aplicação iniciada."
      : false,
  },
  async () => {
    const id = "00000000-0000-4000-8000-000000000001";
    for (const path of [
      `/preview/prototipos/${id}`,
      `/prototipos/${id}/preview`,
    ]) {
      const response = await fetch(new URL(path, base), { redirect: "manual" });
      assert.equal(response.status, 307);
      assert.match(response.headers.get("location") ?? "", /^\/login/);
      assert.match(response.headers.get("cache-control") ?? "", /no-store/);
      assert.doesNotMatch(
        await response.text(),
        /sourceLeadId|confirmedOrigin|customization_data/,
      );
      if (path.startsWith("/preview/")) {
        assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
        assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
      }
    }
    const publicPage = await fetch(new URL("/p/prototipo-ficticio", base));
    assert.equal(publicPage.status, 404);
  },
);
