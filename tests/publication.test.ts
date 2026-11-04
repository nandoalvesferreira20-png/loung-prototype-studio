import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import assets from "../src/config/publication-assets.json";
import { renderToStaticMarkup } from "react-dom/server";
import {
  publicSnapshot,
  publicRendererInput,
  publicDataSchema,
  publicBaseUrl,
  publicLink,
  sharingMessage,
  slugSchema,
} from "../src/lib/publication";
import { restaurantFixture, restaurantTestDesign } from "./fixtures/restaurant";
import { demonstrationContent } from "../src/lib/generation/personalize";
import {
  renderPersistedTemplate,
  templateRenderers,
} from "../src/templates/registry";
import { digitalRestaurantModel } from "../src/templates/restaurants/digital/model";
import { estateModel } from "../src/templates/real-estate/premium/model";
test("publication asset manifest contains only existing local template photography", () => {
  assert.ok(assets.length > 0);
  for (const asset of assets) {
    assert.match(
      asset,
      /^\/templates\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/,
    );
    assert.ok(existsSync(`public${asset}`), asset);
  }
});

test("public snapshot uses allowlist, never source metadata; private edits do not mutate snapshot", () => {
  const draft = restaurantFixture();
  const snapshot = publicSnapshot(draft);
  for (const key of [
    "sourceLeadId",
    "sourceUpdatedAt",
    "confirmedOrigin",
    "missingFields",
    "schemaVersion",
  ])
    assert.equal(key in snapshot, false);
  assert.ok(!JSON.stringify(snapshot).includes(draft.sourceLeadId));
  draft.confirmed.name = "Changed private draft";
  assert.notEqual(snapshot.confirmed.name, draft.confirmed.name);
  assert.equal(
    publicDataSchema.safeParse({ ...snapshot, internalNotes: "secret" })
      .success,
    false,
  );
});
test("public link validates slug, configuration and sharing uses explicit copy only", () => {
  assert.equal(
    publicLink(publicBaseUrl("https://studio.example.test"), "empresa-a123"),
    "https://studio.example.test/p/empresa-a123",
  );
  for (const slug of ["../leads", "A", "a/b", "", "x?secret=1"])
    assert.equal(slugSchema.safeParse(slug).success, false);
  for (const url of [
    "https://user:pass@example.test",
    "https://example.test/path",
    "javascript:alert(1)",
  ])
    assert.throws(() => publicBaseUrl(url));
  assert.match(
    sharingMessage("https://example.test/p/a"),
    /proposta visual demonstrativa/,
  );
});
test("all eight renderers accept public-only snapshots without source identifiers", () => {
  for (const [slug, template] of Object.entries(templateRenderers)) {
    const draft = restaurantFixture({
      niche: template.niche,
      name: "Empresa fictícia de teste",
    });
    draft.illustrative = demonstrationContent[template.niche];
    const html = renderToStaticMarkup(
      renderPersistedTemplate(
        { ...template, slug },
        publicRendererInput(publicSnapshot(draft)),
      ),
    );
    assert.ok(html.includes("Empresa fictícia de teste"), slug);
    assert.ok(!html.includes(draft.sourceLeadId), slug);
    assert.ok(!html.includes("sourceUpdatedAt"), slug);
  }
});
test("public restaurant cart and estate model use the approved snapshot only", () => {
  const draft = restaurantFixture({ whatsapp: "+5511999999999" });
  draft.restaurantDesign = restaurantTestDesign();
  const snapshot = publicSnapshot(draft);
  const before = digitalRestaurantModel(publicRendererInput(snapshot));
  draft.confirmed.whatsapp = "+5521999999999";
  draft.restaurantDesign.items = [];
  assert.deepEqual(
    digitalRestaurantModel(publicRendererInput(snapshot)),
    before,
  );
  const property = restaurantFixture({ niche: "imobiliarias" });
  property.illustrative = demonstrationContent.imobiliarias;
  assert.equal(
    estateModel(publicRendererInput(publicSnapshot(property))).confirmed.niche,
    "imobiliarias",
  );
});
