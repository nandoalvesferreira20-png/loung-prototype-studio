import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  centerFilters,
  initialCenterFilters,
  linksCsv,
  publicationIds,
  updateSelection,
  processPublicationItems,
  type PublicationItem,
} from "../src/lib/publication-center";
const item = (name: string): PublicationItem => ({
  id: randomUUID(),
  name,
  niche: "clinicas",
  template_id: randomUUID(),
  template_name: "Clínica",
  variant: "A",
  revision: 1,
  updated_at: "2026-11-05T12:00:00Z",
  slug: "exemplo",
  state: "never",
  pending: false,
  publication_version: null,
  source_revision: null,
  published_at: null,
  public_name: null,
});
test("center: validated filters, IDs and bounded unique selection", () => {
  assert.ok(centerFilters.safeParse(initialCenterFilters).success);
  for (const bad of [
    { page: -1 },
    { sort: "SQL" },
    { state: "unknown" },
    { ids: [] },
  ])
    assert.equal(
      centerFilters.safeParse({ ...initialCenterFilters, ...bad }).success,
      false,
    );
  const id = randomUUID();
  assert.equal(publicationIds.safeParse([id, id]).success, false);
  assert.equal(
    publicationIds.safeParse(Array.from({ length: 26 }, () => randomUUID()))
      .success,
    false,
  );
});
test("center: selection across pages preserves exact names and page select is not whole-base select", () => {
  const first = Array.from({ length: 12 }, (_, i) => item(`Primeira ${i}`));
  const second = Array.from({ length: 12 }, (_, i) => item(`Segunda ${i}`));
  let selected = updateSelection([], first, true);
  selected = updateSelection(selected, second, true);
  assert.equal(selected.length, 24);
  selected = updateSelection(selected, first, false);
  assert.deepEqual(selected, second);
  assert.deepEqual(updateSelection(selected, second, true), second);
  assert.throws(() =>
    updateSelection(
      selected,
      Array.from({ length: 14 }, () => item("Limite")),
      true,
    ),
  );
  assert.deepEqual(updateSelection(selected, second, false), []);
});
test("center: sequential independent processing records actual partial results and no automatic retry", async () => {
  const items = [item("A"), item("B"), item("C")];
  let calls = 0;
  const progress: number[] = [];
  const results = await processPublicationItems(
    items,
    async (i) => {
      calls++;
      if (i.id === items[1].id) throw new Error("network");
      return { ok: true };
    },
    (r) => progress.push(r.length),
  );
  assert.equal(calls, 3);
  assert.deepEqual(progress, [1, 2, 3]);
  assert.deepEqual(
    results.map((r) => r.ok),
    [true, false, true],
  );
  assert.match(results[1].error!, /não confirmada/);
  await assert.rejects(
    processPublicationItems(
      [items[0], items[0]],
      async () => ({ ok: true }),
      () => {},
    ),
  );
});
test("center: authorization and revalidation failures remain isolated and never become success", async () => {
  const rows = [item("Sem permissão"), item("Revisão mudou"), item("Aprovado")];
  const results = await processPublicationItems(
    rows,
    async (r) =>
      r === rows[0]
        ? { ok: false, error: "admin_required" }
        : r === rows[1]
          ? { ok: false, error: "revision_changed" }
          : { ok: true },
    () => {},
  );
  assert.equal(results.filter((r) => r.ok).length, 1);
  assert.deepEqual(
    results.filter((r) => !r.ok).map((r) => r.error),
    ["admin_required", "revision_changed"],
  );
});
test("center: UTF-8 CSV escapes quotes, line breaks and formula injection; exports only sharing allowlist", () => {
  const csv = linksCsv([
    {
      company: '=HYPERLINK("evil")',
      niche: "Clínicas",
      template: "A\nPremium",
      status: "Publicado",
      url: "https://example.test/p/empresa",
      publishedAt: "2026-11-05",
      ...{ internalNotes: "secret" },
    },
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'));
  assert.ok(csv.includes('"A\nPremium"'));
  assert.ok(csv.includes('"https://example.test/p/empresa"'));
  assert.ok(!csv.includes("secret"));
  for (const company of [
    "+SUM(1)",
    "-1+1",
    "@SUM(1)",
    " \t=1",
    "\tplain",
    "\rplain",
  ])
    assert.ok(
      linksCsv([
        {
          company,
          niche: "",
          template: "",
          status: "",
          url: "",
          publishedAt: "",
        },
      ]).includes(`"'${company}"`),
    );
});
