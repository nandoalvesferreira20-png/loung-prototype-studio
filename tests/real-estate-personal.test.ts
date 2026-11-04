import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPersistedTemplate } from "../src/templates/registry";
import { demonstrationContent } from "../src/lib/generation/personalize";
import {
  personalizationSchema,
  type Personalization,
} from "../src/lib/generation/contracts";
import { realEstateDesignSchema } from "../src/lib/generation/real-estate-design";
import { personalColors } from "../src/templates/real-estate/personal/content";
import { createElement } from "react";
import { PrototypeTable } from "../src/components/prototypes/prototype-table";
import type { ManagedPrototype } from "../src/lib/generation/contracts";
import type { Json } from "../src/types/database";

test("Prototype table: Ver site follows the renderer registry for real estate A and B", () => {
  const item: ManagedPrototype = {
    id: randomUUID(),
    lead_id: randomUUID(),
    template_id: randomUUID(),
    niche: "imobiliarias",
    variant: "B",
    slug: "teste-b",
    status: "draft",
    customization_data: fixture() as unknown as Json,
    created_at: "2026-11-03T12:00:00Z",
    updated_at: "2026-11-03T12:00:00Z",
    published_at: null,
    revision: 1,
    company_name: "Teste",
    template_name: "Corretor Pessoal",
    template_status: "active",
  };
  const table = (row: ManagedPrototype) =>
    renderToStaticMarkup(
      createElement(PrototypeTable, { items: [row], onInspect: () => {} }),
    );
  for (const variant of ["A", "B"] as const) {
    const html = table({ ...item, variant });
    assert.match(html, /Ver site/);
    assert.ok(html.includes(`/prototipos/${item.id}/preview`));
  }
  assert.doesNotMatch(table({ ...item, customization_data: {} }), /Ver site/);
  assert.doesNotMatch(
    table({ ...item, niche: "restaurantes", customization_data: {} }),
    /Ver site/,
  );
});
function fixture(
  values: Partial<Personalization["confirmed"]> = {},
): Personalization {
  const confirmed: Personalization["confirmed"] = {
    name: "Marca imobiliária de teste",
    niche: "imobiliarias",
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
    illustrative: demonstrationContent.imobiliarias,
    missingFields: Object.entries(confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k) as Personalization["missingFields"],
  };
}

const render = (p = fixture()) =>
  renderToStaticMarkup(
    renderPersistedTemplate(
      { slug: "imobiliarias-b", niche: "imobiliarias", variant: "B" },
      p,
    ),
  );
test("Personal B: editorial composition, neutral photography, no invented identity or listings", () => {
  const html = render();
  for (const text of [
    "estatePersonal",
    "peHero",
    "peBenefits",
    "peAbout",
    "peCatalog",
    "peSteps",
    "peBanner",
    "peConsult",
    "peContact",
    "peFooter",
    "Imagem ilustrativa",
    "catálogo ainda não cadastrado",
  ])
    assert.ok(html.includes(text), text);
  assert.doesNotMatch(html, /Marina Costa|CRECI:|R\$|wa.me|estatePremium/);
  for (const color of Object.values(personalColors))
    assert.ok(html.includes(color));
  assert.match(html, /Protótipo demonstrativo desenvolvido pela Loung Tech/);
});
test("Personal B: portrait replacement, framing, removal and demonstration label", () => {
  const p = fixture();
  p.realEstateDesign = {
    version: 1,
    personal: {
      version: 1,
      name: "Nome confirmado",
      portraits: {
        hero: {
          src: "/templates/real-estate/portraits/authorized.webp",
          alt: "Retrato autorizado",
          position: "top",
          demonstration: false,
        },
        about: { src: null, demonstration: true },
      },
    },
  };
  const html = render(p);
  assert.match(html, /authorized.webp/);
  assert.match(html, /object-position:top/);
  assert.match(html, /Nome confirmado/);
  assert.doesNotMatch(html, /Retrato autorizado — imagem ilustrativa/);
  p.realEstateDesign.personal!.portraits!.hero!.demonstration = true;
  assert.match(render(p), /Retrato autorizado — imagem ilustrativa/);
  p.realEstateDesign.personal!.portraits!.hero!.src = null;
  assert.doesNotMatch(render(p), /authorized.webp/);
});
test("Personal B: shared catalog preserves optional values, status and demo restrictions", () => {
  const p = fixture({ whatsapp: "+5511999999999" });
  p.realEstateDesign = {
    version: 1,
    properties: [
      {
        id: randomUUID(),
        title: "Exemplo de card",
        purpose: "venda",
        type: "apartamento",
        images: [],
        status: "disponivel",
        featured: true,
        demonstration: true,
        price: 1234,
        bedrooms: 0,
      },
      {
        id: randomUUID(),
        title: "Oculto",
        purpose: "venda",
        type: "casa",
        images: [],
        status: "inativo",
        featured: false,
        demonstration: false,
      },
    ],
  };
  const html = render(p);
  assert.match(html, /Exemplo fictício · não disponível/);
  assert.match(html, /1.234/);
  assert.match(html, /0 quartos/);
  assert.doesNotMatch(html, /Oculto|Consultar imóvel/);
  p.realEstateDesign.properties![0].demonstration = false;
  assert.match(render(p), /Consultar imóvel/);
});
test("Personal B: contacts, institutional copy, ordering and hidden navigation", () => {
  const p = fixture({
    name: "Equipe Confirmada",
    phone: "1140001234",
    city: "São Paulo",
    state: "SP",
    instagram: "https://instagram.com/equipe",
  });
  p.realEstateDesign = {
    version: 1,
    leadType: "agency",
    sections: ["contact", "about"],
    email: "contato@example.com",
    creci: "CONFIRMADO",
    heroTitle: "Título editado",
    personal: { version: 1, benefits: [] },
  };
  const html = render(p);
  assert.match(html, /Sobre Nós/);
  assert.match(html, /Nosso Trabalho/);
  assert.match(html, /mailto:contato@example.com/);
  assert.match(html, /tel:/);
  assert.match(html, /CONFIRMADO/);
  assert.doesNotMatch(html, /href="#imoveis"|href="#trabalho"|wa.me/);
  assert.ok(html.indexOf('id="contato"') < html.indexOf('id="sobre"'));
});
test("Personal B: old JSONB compatibility, roundtrip and strict validation", () => {
  const old = fixture();
  assert.deepEqual(personalizationSchema.parse(old), old);
  const design = {
    version: 1,
    personal: {
      version: 1,
      heroHighlight: "seu lugar",
      benefits: [{ title: "Contato", description: "Converse" }],
    },
  };
  assert.deepEqual(
    realEstateDesignSchema.parse(JSON.parse(JSON.stringify(design))),
    design,
  );
  for (const personal of [
    { version: 2 },
    { version: 1, unknown: true },
    {
      version: 1,
      portraits: {
        hero: { src: "https://evil.test/a.jpg", demonstration: false },
      },
    },
    { version: 1, portraits: { hero: { src: null } } },
    { version: 1, benefits: Array(4).fill({ title: "a", description: "b" }) },
  ])
    assert.equal(
      realEstateDesignSchema.safeParse({ version: 1, personal }).success,
      false,
    );
});
