import { test } from "node:test";
import assert from "node:assert/strict";
import { niches, templates, importFields } from "../src/config/catalog";
import { demoLeads, demoPrototypes } from "../src/data/demo";
import { filterPrototypes, type PrototypeFilters } from "../src/lib/prototypes";
const all: PrototypeFilters = {
  query: "",
  niche: "",
  status: "",
  template: "",
};
test("catálogo oficial tem quatro nichos e duas variantes por nicho", () => {
  assert.equal(niches.length, 4);
  assert.equal(templates.length, 8);
  assert.equal(new Set(templates.map((t) => t.id)).size, 8);
  for (const niche of niches)
    assert.deepEqual(
      templates.filter((t) => t.nicheId === niche.id).map((t) => t.variant),
      ["A", "B"],
    );
});
test("cada lead tem um único protótipo, com template compatível e sem URL real", () => {
  assert.equal(
    new Set(demoPrototypes.map((p) => p.leadId)).size,
    demoPrototypes.length,
  );
  for (const prototype of demoPrototypes) {
    const lead = demoLeads.find((l) => l.id === prototype.leadId);
    const template = templates.find((t) => t.id === prototype.templateId);
    assert.ok(lead);
    assert.ok(template);
    assert.equal(lead.nicho, template.nicheId);
    assert.equal(prototype.publicUrl, null);
  }
});
test("busca ignora acentos, caixa e espaços externos e encontra especialidades", () => {
  assert.equal(
    filterPrototypes(demoPrototypes, { ...all, query: "  CLINICA  " }).length,
    1,
  );
  assert.equal(
    filterPrototypes(demoPrototypes, { ...all, query: "odontologia" })[0]
      ?.leadId,
    "l1",
  );
});
test("filtros combinados aplicam interseção e retornam estado vazio", () => {
  assert.equal(filterPrototypes(demoPrototypes, all).length, 8);
  assert.equal(
    filterPrototypes(demoPrototypes, { ...all, niche: "clinicas" }).length,
    2,
  );
  assert.equal(
    filterPrototypes(demoPrototypes, {
      ...all,
      niche: "clinicas",
      status: "publicado",
      template: "clinicas-A",
    }).length,
    1,
  );
  assert.equal(
    filterPrototypes(demoPrototypes, {
      ...all,
      niche: "clinicas",
      template: "advocacia-A",
    }).length,
    0,
  );
  assert.equal(
    filterPrototypes(demoPrototypes, { ...all, query: "empresa inexistente" })
      .length,
    0,
  );
});
test("contrato de importação contempla treze campos e somente nome obrigatório", () => {
  assert.equal(importFields.length, 13);
  assert.equal(new Set(importFields.map((f) => f.key)).size, 13);
  assert.deepEqual(
    importFields.filter((f) => f.required).map((f) => f.key),
    ["nome_empresa"],
  );
});
