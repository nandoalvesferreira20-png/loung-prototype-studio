import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPersistedTemplate } from "../src/templates/registry";
import { demonstrationContent } from "../src/lib/generation/personalize";
import {
  personalizationSchema,
  type Personalization,
} from "../src/lib/generation/contracts";
import { lawModernDesignSchema } from "../src/lib/generation/law-modern-design";
function fixture(
  values: Partial<Personalization["confirmed"]> = {},
): Personalization {
  const confirmed: Personalization["confirmed"] = {
    name: "Lima & Costa · escritório de teste",
    niche: "advocacia",
    specialty: null,
    city: null,
    state: null,
    address: null,
    phone: null,
    whatsapp: null,
    website: null,
    instagram: null,
    description: null,
    services: [],
    ...values,
  };
  return {
    schemaVersion: 1,
    sourceLeadId: randomUUID(),
    sourceUpdatedAt: "2026-11-03T12:00:00Z",
    confirmedOrigin: "lead_snapshot",
    confirmed,
    illustrative: demonstrationContent.advocacia,
    missingFields: Object.entries(confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k) as Personalization["missingFields"],
  };
}

const modern = {
  slug: "advocacia-b",
  niche: "advocacia" as const,
  variant: "B" as const,
};
const classic = { ...modern, slug: "advocacia-a", variant: "A" as const };
const render = (data = fixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(modern, data));
test("Advocacia B: identidade independente e nenhum profissional inventado", () => {
  const html = render();
  assert.match(html, /lawModern/);
  assert.doesNotMatch(
    html,
    /lawClassic|NEXO|Rafael Martins|Camila Ribeiro|law-office-reception/,
  );
  for (const name of ["hero-office", "meeting-room", "contact-office"]) {
    assert.match(html, new RegExp(name));
    assert.ok(existsSync(`public/templates/law/modern/${name}.png`));
  }
  assert.doesNotMatch(html, /professionals.png/);
});
test("Advocacia B: áreas confirmadas e ocultação sem invenção", () => {
  for (const count of [1, 2, 3, 6, 9]) {
    const data = fixture({
      services: Array.from(
        { length: count },
        (_, i) => `Área confirmada ${i + 1}`,
      ),
    });
    const html = render(data);
    for (const area of data.confirmed.services) assert.ok(html.includes(area));
  }
  const data = fixture({ services: ["Área visível", "Área oculta"] });
  data.lawModernDesign = {
    version: 1,
    areaDetails: { "Área oculta": { hidden: true } },
  };
  assert.doesNotMatch(render(data), /Área oculta/);
});
test("Advocacia B: edição e reordenação preservam A", () => {
  const data = fixture();
  const before = renderToStaticMarkup(renderPersistedTemplate(classic, data));
  data.lawModernDesign = {
    version: 1,
    heroTitle: "Título aprovado B",
    manifestoTitle: "Manifesto aprovado",
    colors: { primary: "#123456" },
    sections: ["contact", "manifesto"],
    images: { hero: { src: null } },
  };
  const html = render(data);
  assert.match(html, /Título aprovado B/);
  assert.match(html, /#123456/);
  assert.ok(html.indexOf('id="contato"') < html.indexOf('id="manifesto"'));
  assert.equal(
    renderToStaticMarkup(renderPersistedTemplate(classic, data)),
    before,
  );
  assert.ok(personalizationSchema.safeParse(data).success);
});
test("Advocacia B: somente equipe autorizada e URLs seguras", () => {
  const data = fixture();
  data.lawModernDesign = {
    version: 1,
    team: [
      {
        name: "Pessoa autorizada",
        authorized: true,
        profileUrl: "https://example.test/perfil",
      },
    ],
    images: {
      professionals: {
        src: "/templates/law/modern/hero-office.png",
        illustrative: true,
      },
    },
  };
  const html = render(data);
  assert.match(html, /Pessoa autorizada/);
  assert.match(html, /https:\/\/example.test\/perfil/);
  assert.doesNotMatch(html, /Foto demonstrativa de profissionais/);
  for (const invalid of [
    { version: 1, team: [{ name: "Fake", authorized: false }] },
    {
      version: 1,
      team: [
        {
          name: "Fake",
          authorized: true,
          photo: "/templates/law/modern/hero-office.png",
          photoAuthorized: true,
        },
      ],
    },
    { version: 1, areaDetails: { Civil: { href: "javascript:alert(1)" } } },
    {
      version: 1,
      images: {
        hero: { src: "/templates/law/shared/law-office-reception.png" },
      },
    },
    {
      version: 1,
      images: {
        hero: {
          src: "/templates/law/modern/hero-office.png",
          illustrative: false,
        },
      },
    },
    { version: 1, sections: ["about", "about"] },
  ])
    assert.equal(lawModernDesignSchema.safeParse(invalid).success, false);
});
