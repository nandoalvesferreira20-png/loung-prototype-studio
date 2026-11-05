import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  activePrototypeUrl,
  previewUrl,
  openingSelection,
  generatedPrototypeGroups,
  OPEN_LINK_PAGE_SIZE,
  copyPrototypeLink,
} from "../src/lib/prototype-links";
import { QuickPrototypeLinks } from "../src/components/prototypes/quick-prototype-links";
import { SelectedPrototypeLinks } from "../src/components/prototypes/selected-prototype-links";

test("quick access: configured public origin, active state and valid slug are required", () => {
  assert.equal(
    activePrototypeUrl("https://studio.example", "empresa-existente", true),
    "https://studio.example/p/empresa-existente",
  );
  for (const [base, slug, active] of [
    [null, "empresa", true],
    ["https://studio.example", "empresa", false],
    ["https://studio.example", "../admin", true],
    ["https://studio.example", "", true],
    ["javascript:alert(1)", "empresa", true],
  ] as const)
    assert.equal(activePrototypeUrl(base, slug, active), null);
  const before = process.env.NODE_ENV;
  try {
    Reflect.set(process.env, "NODE_ENV", "production");
    for (const base of [
      "http://localhost:3000",
      "https://localhost",
      "https://127.0.0.1",
    ])
      assert.equal(activePrototypeUrl(base, "empresa", true), null);
  } finally {
    if (before === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", before);
  }
  const id = randomUUID();
  assert.equal(previewUrl(id), `/prototipos/${id}/preview`);
  assert.equal(previewUrl("../admin"), null);
});

test("quick access: published opens in new tab, drafts use authenticated preview and copy is disabled without URL", () => {
  const props = {
    id: randomUUID(),
    name: "Empresa",
    base: "https://studio.example",
    slug: "empresa",
    active: true,
  };
  const html = renderToStaticMarkup(createElement(QuickPrototypeLinks, props));
  assert.match(html, /href="https:\/\/studio.example\/p\/empresa"/);
  assert.match(html, /target="_blank" rel="noopener noreferrer"/);
  assert.match(html, /Copiar link público de Empresa/);
  for (const missing of [
    { active: false },
    { base: null },
    { slug: "INVALID" },
  ]) {
    const unavailable = renderToStaticMarkup(
      createElement(QuickPrototypeLinks, { ...props, ...missing }),
    );
    assert.ok(unavailable.includes(`/prototipos/${props.id}/preview`));
    assert.doesNotMatch(unavailable, /href="https:/);
    assert.match(unavailable, /disabled=""/);
  }
});

test("copy: writes only a validated active absolute URL and propagates clipboard failures", async () => {
  const copied: string[] = [];
  const write = async (url: string) => {
    copied.push(url);
  };
  assert.equal(
    await copyPrototypeLink("https://studio.example", "empresa", true, write),
    true,
  );
  assert.deepEqual(copied, ["https://studio.example/p/empresa"]);
  assert.equal(
    await copyPrototypeLink("https://studio.example", "empresa", false, write),
    false,
  );
  assert.equal(await copyPrototypeLink(null, "empresa", true, write), false);
  assert.equal(copied.length, 1);
  await assert.rejects(
    copyPrototypeLink("https://studio.example", "empresa", true, async () => {
      throw new Error("denied");
    }),
    /denied/,
  );
});

test("selected opening: server-confirmed IDs only, omitted names and at most five individually clickable links", () => {
  const selected = Array.from({ length: 8 }, (_, index) => ({
    id: randomUUID(),
    name: `Empresa ${index}`,
  }));
  const confirmed = selected
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      company: item.name,
      url: `https://studio.example/p/empresa-${item.name.slice(-1)}`,
    }));
  const data = openingSelection(selected, [
    ...confirmed,
    confirmed[0],
    {
      id: randomUUID(),
      company: "Fora da seleção",
      url: "https://studio.example/p/outra",
    },
  ]);
  assert.equal(data.total, 8);
  assert.equal(data.links.length, 6);
  assert.deepEqual(data.omitted, ["Empresa 6", "Empresa 7"]);
  assert.equal(OPEN_LINK_PAGE_SIZE, 5);
  const html = renderToStaticMarkup(
    createElement(SelectedPrototypeLinks, {
      data,
      busy: false,
      message: "",
      onClose: () => {},
      onShare: () => {},
    }),
  );
  assert.equal((html.match(/target="_blank"/g) ?? []).length, 5);
  assert.match(html, /Empresa 6/);
  assert.doesNotMatch(html, /Fora da seleção/);
  assert.match(html, /Copiar todos os links/);
});

test("generated prototypes: exact IDs are preserved in bounded groups without silently dropping items", () => {
  const ids = Array.from({ length: 61 }, () => randomUUID());
  const groups = generatedPrototypeGroups([...ids, ids[0], "invalid"]);
  assert.deepEqual(
    groups.map((group) => group.length),
    [25, 25, 11],
  );
  assert.deepEqual(groups.flat(), ids);
});
