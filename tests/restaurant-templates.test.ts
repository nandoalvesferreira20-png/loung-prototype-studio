import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPersistedTemplate } from "../src/templates/registry";
import { rendererRegistry } from "../src/lib/generation/registry";
import {
  restaurantDesignSchema,
  restaurantColors,
} from "../src/lib/generation/restaurant-design";
import {
  personalizationSchema,
  type ManagedPrototype,
} from "../src/lib/generation/contracts";
import type { Json } from "../src/types/database";
import { restaurantPhotos } from "../src/templates/restaurants/premium/photography";
import {
  restaurantModel,
  visibleRestaurantItems,
  restaurantPrice,
} from "../src/templates/restaurants/premium/model";
import { PrototypeTable } from "../src/components/prototypes/prototype-table";
import { RestaurantControls } from "../src/components/prototypes/restaurant-controls";
import {
  restaurantFixture,
  restaurantTestItem,
  restaurantTestDesign,
} from "./fixtures/restaurant";
const template = {
  slug: "restaurantes-a",
  niche: "restaurantes" as const,
  variant: "A" as const,
};
const render = (p = restaurantFixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(template, p));

test("Restaurants A: complete editorial composition with local illustrative photography and empty menu", () => {
  const html = render();
  for (const section of [
    "rpHeader",
    "rpHero",
    "rpIntroduction",
    "rpGastronomy",
    "rpMenu",
    "rpHistory",
    "rpGallery",
    "rpConversion",
    "rpContact",
    "rpFooter",
  ])
    assert.ok(html.includes(section), section);
  for (const p of Object.values(restaurantPhotos)) {
    assert.ok(existsSync(`public${p.src}`));
    assert.ok(html.includes(p.src.split("/").pop()!));
  }
  for (const color of Object.values(restaurantColors))
    assert.ok(html.includes(color));
  assert.match(html, /cardápio não cadastrado/);
  assert.match(html, /Referência ilustrativa/);
  assert.doesNotMatch(
    html,
    /OLIVA|R\$|Salmão Grelhado|Fundado em|wa.me|Horário de funcionamento|rpDishBody/,
  );
  assert.doesNotMatch(html, /href="#cardapio"/);
  assert.match(html, /Protótipo demonstrativo desenvolvido pela Loung Tech/);
});
test("Restaurants A: confirmed menu, optional prices, categories, availability, highlights and order", () => {
  const p = restaurantFixture();
  const hidden = randomUUID();
  p.restaurantDesign = {
    ...restaurantTestDesign(),
    categories: [{ id: hidden, name: "Oculta", hidden: true, order: 0 }],
    items: [
      restaurantTestItem({ name: "Primeiro por ordem", order: 1, price: 0 }),
      restaurantTestItem({ name: "Segundo por ordem", order: 2, price: 42.5 }),
      restaurantTestItem({
        name: "Destaque primeiro",
        order: 9,
        featured: true,
      }),
      restaurantTestItem({ name: "Produto indisponível", available: false }),
      restaurantTestItem({
        name: "Produto de categoria oculta",
        categoryId: hidden,
      }),
    ],
  };
  const html = render(p);
  assert.match(html, /R\$[^<]*42,50/);
  assert.match(html, /R\$[^<]*0,00/);
  assert.doesNotMatch(
    html,
    /Produto indisponível|Produto de categoria oculta|>Oculta</,
  );
  assert.ok(
    html.indexOf("Destaque primeiro") < html.indexOf("Primeiro por ordem"),
  );
  assert.ok(
    html.indexOf("Primeiro por ordem") < html.indexOf("Segundo por ordem"),
  );
  assert.match(html, /Conheça o Cardápio/);
  assert.equal(restaurantPrice(null), null);
  assert.equal(visibleRestaurantItems(p.restaurantDesign).length, 3);
});
test("Restaurants A: three initial dishes, complete-menu control and category navigation", () => {
  const p = restaurantFixture();
  const categoryId = randomUUID();
  p.restaurantDesign = {
    version: 1,
    categories: [
      { id: categoryId, name: "Categoria confirmada", hidden: false, order: 0 },
    ],
    items: Array.from({ length: 5 }, (_, order) =>
      restaurantTestItem({ order, name: `Produto ${order}`, categoryId }),
    ),
  };
  const html = render(p);
  assert.equal((html.match(/class="rpDish"/g) ?? []).length, 3);
  assert.match(html, /Ver cardápio completo/);
  assert.match(html, /Categoria confirmada/);
  p.restaurantDesign.menuLimit = 5;
  assert.equal((render(p).match(/class="rpDish"/g) ?? []).length, 5);
});
test("Restaurants A: photographic replacement, framing, gallery removal, copies and section navigation", () => {
  const p = restaurantFixture();
  p.restaurantDesign = {
    ...restaurantTestDesign(),
    subtitle: "Cozinha confirmada",
    symbol: "monogram",
    sections: ["contact", "gastronomy"],
    images: {
      hero: {
        src: "/templates/restaurants/authorized/hero.webp",
        alt: "Imagem autorizada",
        demonstration: false,
        position: "left",
      },
      gastronomy: { src: null, demonstration: false },
    },
    copy: { heroTitle: "Título editado", contactTitle: "Vamos conversar" },
  };
  const html = render(p);
  assert.match(html, /hero.webp/);
  assert.match(html, /object-position:left/);
  assert.match(html, /Sem fotografia/);
  assert.match(html, /Título editado/);
  assert.match(html, /Cozinha confirmada/);
  assert.doesNotMatch(
    html,
    /href="#historia"|href="#ambiente"|href="#cardapio"|rpGallery|rpHistory/,
  );
  assert.ok(
    html.indexOf('id="contato"') < html.indexOf('class="rpGastronomy"'),
  );
});
test("Restaurants A: contacts use confirmed channels; valid international WhatsApp wins and missing fields disappear", () => {
  const p = restaurantFixture({
    name: "Nome confirmado",
    whatsapp: "11999999999",
    phone: "1140001234",
    city: "São Paulo",
    state: "SP",
    instagram: "https://instagram.com/exemplo",
  });
  p.restaurantDesign = {
    version: 1,
    email: "contato@example.com",
    openingHours: "Segunda, horário confirmado",
  };
  const html = render(p);
  assert.doesNotMatch(html, /wa.me/);
  assert.match(html, /tel:1140001234/);
  assert.match(html, /Horário de funcionamento/);
  assert.match(html, /Segunda, horário confirmado/);
  assert.match(html, /mailto:contato@example.com/);
  p.confirmed.whatsapp = "+5511999999999";
  assert.match(render(p), /https:\/\/wa.me\/5511999999999/);
  assert.doesNotMatch(
    render(),
    /Rua das Oliveiras|4000-1234|99999-9999|Horário de funcionamento|mailto:/,
  );
});
test("Restaurants A: illustrative menu requires explicit demo and never creates automatic dishes", () => {
  const p = restaurantFixture();
  p.restaurantDesign = {
    version: 1,
    items: [
      restaurantTestItem({
        demonstration: true,
        image: restaurantPhotos.gastronomy,
        price: 10,
      }),
    ],
  };
  assert.match(
    render(p),
    /Exemplo demonstrativo · não é oferta do restaurante/,
  );
  assert.equal(
    restaurantDesignSchema.safeParse({
      ...p.restaurantDesign,
      items: [{ ...p.restaurantDesign.items![0], demonstration: false }],
    }).success,
    false,
  );
  assert.equal(
    restaurantDesignSchema.safeParse({
      version: 1,
      images: { hero: { ...restaurantPhotos.hero, demonstration: false } },
    }).success,
    false,
  );
});
test("Restaurants A: unavailable-only menu does not claim that nothing was registered", () => {
  const p = restaurantFixture();
  p.restaurantDesign = {
    version: 1,
    items: [restaurantTestItem({ available: false })],
  };
  assert.match(render(p), /sem produtos disponíveis/);
  assert.doesNotMatch(render(p), /cardápio não cadastrado|Conheça o Cardápio/);
});
test("Restaurants A: schema rejects unsafe assets, markup, wrong niche, duplicates, missing categories and exceeded limits", () => {
  const item = restaurantTestItem();
  const invalid: unknown[] = [
    { version: 2 },
    { version: 1, unknown: true },
    { version: 1, copy: { heroTitle: "<script>alert(1)</script>" } },
    {
      version: 1,
      images: {
        hero: { src: "https://evil.test/a.png", demonstration: false },
      },
    },
    { version: 1, logo: "/templates/restaurants/../x.png" },
    { version: 1, colors: { forest: "red" } },
    { version: 1, items: [{ ...item, price: -1 }] },
    { version: 1, items: [{ ...item, price: Infinity }] },
    { version: 1, items: [item, item] },
    { version: 1, items: [{ ...item, categoryId: randomUUID() }] },
    {
      version: 1,
      items: Array.from({ length: 61 }, () => restaurantTestItem()),
    },
    { version: 1, gallery: Array(13).fill(restaurantPhotos.hero) },
    { version: 1, sections: ["menu", "menu"] },
    { version: 1, menuLimit: 0 },
    { version: 1, menuLimit: 3.5 },
  ];
  for (const d of invalid)
    assert.equal(
      restaurantDesignSchema.safeParse(d).success,
      false,
      JSON.stringify(d),
    );
  const p = restaurantFixture({ niche: "imobiliarias" });
  p.restaurantDesign = { version: 1 };
  assert.equal(personalizationSchema.safeParse(p).success, false);
});
test("Restaurants A: old records, roundtrip, editor controls, renderer and Ver site button", async () => {
  const p = restaurantFixture();
  assert.deepEqual(personalizationSchema.parse(p), p);
  p.restaurantDesign = restaurantTestDesign();
  assert.deepEqual(
    personalizationSchema.parse(JSON.parse(JSON.stringify(p))),
    p,
  );
  const editor = renderToStaticMarkup(
    createElement(RestaurantControls, {
      value: p.restaurantDesign,
      onChange: () => {},
    }),
  );
  for (const text of [
    "Adicionar produto",
    "Adicionar categoria",
    "Preço confirmado",
    "Disponível",
    "Subir produto",
    "Excluir produto",
    "Horários confirmados",
    "Adicionar fotografia",
    "Restaurar padrões visuais",
  ])
    assert.ok(editor.includes(text));
  assert.equal(typeof rendererRegistry["restaurantes:A"].renderer, "function");
  assert.equal(typeof rendererRegistry["restaurantes:B"].renderer, "function");
  assert.ok(
    await rendererRegistry["restaurantes:A"].renderer!({
      prototypeId: randomUUID(),
      slug: "teste",
      personalization: p,
    }),
  );
  assert.equal(restaurantModel(p).items.length, 1);
  const row: ManagedPrototype = {
    id: randomUUID(),
    lead_id: p.sourceLeadId,
    template_id: randomUUID(),
    niche: "restaurantes",
    variant: "A",
    slug: "teste",
    status: "draft",
    customization_data: p as unknown as Json,
    created_at: p.sourceUpdatedAt,
    updated_at: p.sourceUpdatedAt,
    published_at: null,
    revision: 1,
    company_name: p.confirmed.name,
    template_name: "Gastronômico Premium",
    template_status: "active",
  };
  const html = renderToStaticMarkup(
    createElement(PrototypeTable, { items: [row], onInspect: () => {} }),
  );
  assert.match(html, /Ver site/);
  assert.ok(html.includes(`/prototipos/${row.id}/preview`));
  assert.throws(
    () =>
      renderPersistedTemplate(
        { ...template, variant: "B", slug: "restaurantes-a" },
        p,
      ),
    /renderer_unavailable/,
  );
});
