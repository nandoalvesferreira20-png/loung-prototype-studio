import {
  loadPrivatePreview,
  type PreviewPort,
} from "../src/lib/prototype-preview";
import type { PrototypeRow, TemplateRow } from "../src/types/database";
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
import {
  realEstateDesignSchema,
  propertySchema,
  type EstateProperty,
} from "../src/lib/generation/real-estate-design";
import {
  filterProperties,
  emptyFilters,
  propertyPrice,
} from "../src/templates/real-estate/premium/catalog";
import { estatePhotos } from "../src/templates/real-estate/premium/photography";
import { rendererRegistry } from "../src/lib/generation/registry";
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

const template = {
  slug: "imobiliarias-a",
  niche: "imobiliarias" as const,
  variant: "A" as const,
};
const render = (data = fixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(template, data));
function property(overrides: Partial<EstateProperty> = {}): EstateProperty {
  return {
    id: randomUUID(),
    title: "Imóvel confirmado de teste",
    purpose: "venda",
    type: "casa",
    images: [],
    status: "disponivel",
    featured: false,
    demonstration: false,
    ...overrides,
  };
}
test("Imobiliárias A: composição institucional sem inventar catálogo", () => {
  const html = render();
  assert.match(html, /estatePremium/);
  assert.match(html, /Catálogo ainda não cadastrado/);
  assert.match(html, /Imagem ilustrativa/);
  assert.doesNotMatch(
    html,
    /AURORA|Casa Horizonte|R\$|reSearch|rePropertyBody|CRECI:/,
  );
  for (const photo of Object.values(estatePhotos)) {
    assert.ok(existsSync(`public${photo.src}`));
    assert.ok(html.includes(photo.src!.split("/").pop()!));
  }
  assert.match(html, /Protótipo demonstrativo desenvolvido pela Loung Tech/);
});
test("Imobiliárias A: catálogo real, demonstração, status e campos opcionais", () => {
  const data = fixture();
  data.realEstateDesign = {
    version: 1,
    properties: [
      property({
        title: "Casa real",
        price: 980000,
        area: 120,
        bedrooms: 0,
        parking: 2,
        city: "São Paulo",
        images: [{ src: "/templates/real-estate/properties/test.png" }],
      }),
      property({
        title: "Exemplo sinalizado",
        demonstration: true,
        images: [estatePhotos.hero],
        purpose: "locacao",
        price: 2500,
      }),
      property({ title: "Imóvel oculto", status: "inativo" }),
    ],
  };
  const html = render(data);
  assert.match(html, /Casa real/);
  assert.match(html, /980.000/);
  assert.match(html, /2.500.*mês/);
  assert.match(html, /Exemplo fictício/);
  assert.doesNotMatch(html, /Imóvel oculto/);
  assert.match(html, /reSearch/);
  assert.match(html, /São Paulo/);
  assert.match(html, /0 dorm/);
});
test("Imobiliárias A: filtros tipados combinam finalidade, tipo, cidade, bairro e preço", () => {
  const a = property({
      purpose: "venda",
      type: "casa",
      city: "São Paulo",
      neighborhood: "Jardim América",
      price: 500000,
    }),
    b = property({
      purpose: "locacao",
      type: "apartamento",
      city: "Santos",
      price: 3500,
    }),
    c = property({ price: null }),
    hidden = property({ status: "inativo" });
  const list = [a, b, c, hidden];
  assert.deepEqual(filterProperties(list, emptyFilters), [a, b, c]);
  assert.deepEqual(
    filterProperties(list, {
      purpose: "venda",
      type: "casa",
      location: "sao PAULO",
      price: "under500",
    }),
    [a],
  );
  assert.deepEqual(
    filterProperties(list, { ...emptyFilters, location: "america" }),
    [a],
  );
  assert.deepEqual(
    filterProperties(list, { ...emptyFilters, purpose: "locacao" }),
    [b],
  );
  assert.deepEqual(
    filterProperties(list, { ...emptyFilters, price: "over3m" }),
    [],
  );
  for (const [price, band] of [
    [500001, "500to1m"],
    [1000000, "500to1m"],
    [1000001, "1to3m"],
    [3000000, "1to3m"],
    [3000001, "over3m"],
  ] as const)
    assert.equal(
      filterProperties([property({ price })], { ...emptyFilters, price: band })
        .length,
      1,
    );
});
test("Imobiliárias A: preços nulos, zero, venda e locação", () => {
  assert.equal(propertyPrice({ price: null, purpose: "venda" }), null);
  assert.match(propertyPrice({ price: 0, purpose: "venda" })!, /0/);
  assert.match(
    propertyPrice({ price: 17500, purpose: "locacao" })!,
    /17.500.*mês/,
  );
  assert.doesNotMatch(
    propertyPrice({ price: 5980000, purpose: "venda" })!,
    /mês/,
  );
});
test("Imobiliárias A: personalização, seções, contatos e categorias derivadas", () => {
  const data = fixture({
    whatsapp: "+5511999999999",
    description: "Descrição confirmada",
    services: ["Serviço confirmado"],
  });
  data.realEstateDesign = {
    version: 1,
    leadType: "broker",
    heroTitle: "Título personalizado",
    creci: "Registro confirmado",
    email: "contato@example.test",
    colors: { primary: "#123456" },
    sections: ["contact", "about", "categories", "properties"],
    properties: [property({ type: "apartamento" })],
    categories: [{ type: "apartamento", hidden: true }],
  };
  const html = render(data);
  assert.match(html, /Título personalizado/);
  assert.match(html, /#123456/);
  assert.match(html, /Registro confirmado/);
  assert.match(html, /wa.me/);
  assert.ok(html.indexOf('id="contato"') < html.indexOf('id="sobre"'));
  assert.doesNotMatch(html, /reCategories|reSteps|reEditorial/);
  assert.ok(personalizationSchema.safeParse(data).success);
  assert.doesNotMatch(render(), /mailto:|wa.me|tel:/);
});
test("Imobiliárias A: validação rejeita versões, excesso, URLs e anúncios ambíguos", () => {
  const p = property();
  for (const bad of [
    { version: 2 },
    { version: 1, colors: { primary: "red" } },
    { version: 1, sections: ["about", "about"] },
    { version: 1, properties: [p, p] },
    { version: 1, properties: Array.from({ length: 49 }, () => property()) },
    { version: 1, properties: [{ ...p, price: -1 }] },
    { version: 1, properties: [{ ...p, bedrooms: 1.5 }] },
    { version: 1, properties: [{ ...p, demonstration: undefined }] },
    { version: 1, properties: [{ ...p, images: [estatePhotos.hero] }] },
    { version: 1, images: { hero: { src: "https://evil.test/a.png" } } },
    {
      version: 1,
      images: { hero: { src: "/templates/real-estate/../secret.png" } },
    },
    { version: 1, facebook: "javascript:alert(1)" },
    {
      version: 1,
      properties: [
        { ...p, images: Array.from({ length: 11 }, () => ({ src: null })) },
      ],
    },
  ])
    assert.equal(
      realEstateDesignSchema.safeParse(bad).success,
      false,
      JSON.stringify(bad),
    );
  assert.ok(
    propertySchema.safeParse({
      ...p,
      demonstration: true,
      images: [estatePhotos.hero],
    }).success,
  );
  const other = fixture();
  other.confirmed.niche = "clinicas";
  other.realEstateDesign = { version: 1 };
  assert.equal(personalizationSchema.safeParse(other).success, false);
});
test("Imobiliárias A: motor e compatibilidade sem extensão", async () => {
  assert.equal(typeof rendererRegistry["imobiliarias:A"].renderer, "function");
  assert.equal(typeof rendererRegistry["imobiliarias:B"].renderer, "function");
  assert.match(
    renderToStaticMarkup(
      (await rendererRegistry["imobiliarias:A"].renderer!({
        prototypeId: randomUUID(),
        slug: "teste",
        personalization: fixture(),
      })) as React.ReactNode,
    ),
    /estatePremium/,
  );
  assert.throws(
    () =>
      renderPersistedTemplate(
        { ...template, slug: "imobiliarias-inexistente" },
        fixture(),
      ),
    /renderer_unavailable/,
  );
});

test("Imobiliárias A: prévia autoriza antes de ler anúncios", async () => {
  let reads = 0;
  const data = fixture();
  data.realEstateDesign = {
    version: 1,
    properties: [property({ title: "Anúncio privado" })],
  };
  const port: PreviewPort = {
    authorize: async () => {
      throw new Error("unauthorized");
    },
    prototype: async () => {
      reads++;
      return {
        id: randomUUID(),
        niche: "imobiliarias",
        template_id: randomUUID(),
        customization_data: data,
      } as unknown as PrototypeRow;
    },
    template: async () => ({ ...template, id: randomUUID() }) as TemplateRow,
  };
  await assert.rejects(loadPrivatePreview(randomUUID(), port), /unauthorized/);
  assert.equal(reads, 0);
  port.authorize = async () => {};
  const loaded = await loadPrivatePreview(randomUUID(), port);
  assert.ok(loaded);
  assert.match(
    renderToStaticMarkup(
      renderPersistedTemplate(
        loaded.template,
        loaded.prototype.customization_data,
      ),
    ),
    /Anúncio privado/,
  );
});
test("Imobiliárias A: limite de bytes protege JSONB com campos válidos", () => {
  const image = {
    src: "/templates/real-estate/properties/" + "a".repeat(1000) + ".png",
    alt: "a".repeat(300),
  };
  assert.equal(
    realEstateDesignSchema.safeParse({
      version: 1,
      properties: Array.from({ length: 48 }, () =>
        property({
          description: "a".repeat(3000),
          additional: "a".repeat(1000),
          images: Array.from({ length: 10 }, () => image),
        }),
      ),
    }).success,
    false,
  );
});
