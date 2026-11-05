import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  restaurantFixture,
  restaurantTestDesign,
  restaurantTestItem,
} from "./fixtures/restaurant";
import { digitalRestaurantModel } from "../src/templates/restaurants/digital/model";
import {
  digitalCatalog,
  priceInCents,
  formatCents,
  canOrder,
  reconcileCart,
  changeCart,
  cartSummary,
  cleanNotes,
  whatsappOrder,
  type CartEntry,
} from "../src/templates/restaurants/digital/cart";
import { CartPanel } from "../src/templates/restaurants/digital/cart-panel";
import { renderPersistedTemplate } from "../src/templates/registry";
import { rendererRegistry } from "../src/lib/generation/registry";
import {
  restaurantDesignSchema,
  digitalColors,
  type RestaurantDesign,
} from "../src/lib/generation/restaurant-design";
import {
  personalizationSchema,
  type ManagedPrototype,
} from "../src/lib/generation/contracts";
import { PrototypeTable } from "../src/components/prototypes/prototype-table";
import { RestaurantControls } from "../src/components/prototypes/restaurant-controls";
import type { Json } from "../src/types/database";
const template = {
  slug: "restaurantes-b",
  niche: "restaurantes" as const,
  variant: "B" as const,
};
const render = (p = restaurantFixture()) =>
  renderToStaticMarkup(renderPersistedTemplate(template, p));
test("Digital B: distinct composition, truthful empty menu, environment fallback and zero cart", () => {
  const html = render();
  for (const name of [
    "restaurantDigital",
    "rdHeader",
    "rdHero",
    "rdMenu",
    "rdDesktopCart",
    "rdCart",
    "rdAbout",
    "rdContact",
    "rdFooter",
    "rdDrawer",
  ])
    assert.ok(html.includes(name), name);
  for (const color of Object.values(digitalColors))
    assert.ok(html.includes(color));
  assert.match(html, /Seu carrinho está vazio/);
  assert.match(html, /Restaurante de teste/);
  assert.match(html, /cardápio ainda não tem produtos/);
  assert.match(html, /Referência ilustrativa/);
  assert.doesNotMatch(
    html,
    /SABORÊ|Saborê Burger|restaurant-dish-closeup|rdProductBody|Pedido pelo WhatsApp|href="#como-pedir"|href="#cardapio"/,
  );
  assert.doesNotMatch(html, /class="restaurantPremium/);
  assert.match(html, /Protótipo demonstrativo desenvolvido pela Loung Tech/);
});
test("Digital B: shared menu, real categories, unavailable items and safe product fallback", () => {
  const p = restaurantFixture({ whatsapp: "+5511999999999" });
  p.restaurantDesign = restaurantTestDesign();
  p.restaurantDesign.items!.push(
    restaurantTestItem({
      name: "Indisponível no teste",
      available: false,
      price: 20,
    }),
    restaurantTestItem({ name: "Preço ausente", price: null }),
    restaurantTestItem({ name: "Preço fracionário", price: 12.345 }),
    restaurantTestItem({ name: "Exemplo", demonstration: true, price: 10 }),
  );
  const html = render(p);
  assert.match(html, /Categoria de teste/);
  assert.match(html, /Foto do produto pendente/);
  assert.match(html, /Indisponível/);
  assert.match(html, /Preço sob consulta/);
  assert.match(html, /Exemplo demonstrativo/);
  assert.match(html, /Pedido pelo WhatsApp/);
  const disabled = (name: string) =>
    new RegExp(`disabled=""[^>]*aria-label="Adicionar ${name}"`);
  for (const name of [
    "Indisponível no teste",
    "Preço ausente",
    "Preço fracionário",
    "Exemplo",
  ])
    assert.match(html, disabled(name));
  assert.equal(digitalRestaurantModel(p).items.length, 5);
  const cat = p.restaurantDesign.categories![0];
  cat.hidden = true;
  assert.doesNotMatch(render(p), /Categoria de teste/);
  assert.equal(digitalCatalog(p.restaurantDesign).length, 4);
});
test("Digital cart: integer cents, add, increment, decrement, remove, clear and quantity limit", () => {
  const one = restaurantTestItem({ price: 0.1 }),
    two = restaurantTestItem({ price: 0.2 });
  const d: RestaurantDesign = {
    version: 1,
    items: [one, two],
    digital: { version: 1, maxQuantity: 3 },
  };
  let entries: CartEntry[] = [];
  entries = changeCart(entries, one.id, 1, d);
  entries = changeCart(entries, two.id, 1, d);
  assert.equal(cartSummary(entries, d).totalCents, 30);
  assert.equal(
    formatCents(30),
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(0.3),
  );
  entries = changeCart(entries, one.id, 99, d);
  assert.equal(entries[0].quantity, 3);
  assert.equal(cartSummary(entries, d).count, 4);
  entries = changeCart(entries, one.id, -1, d);
  assert.equal(entries[0].quantity, 2);
  entries = changeCart(entries, two.id, -1, d);
  assert.equal(entries.length, 1);
  entries = entries.filter((e) => e.id !== one.id);
  assert.equal(cartSummary(entries, d).totalCents, 0);
  entries = [];
  assert.deepEqual(reconcileCart(entries, d), []);
  for (const price of [null, NaN, Infinity, -1, 1000001, 12.345])
    assert.equal(priceInCents(price), null);
  assert.equal(priceInCents(0.1 + 0.2), 30);
  assert.equal(priceInCents(34.9), 3490);
  assert.equal(priceInCents(0), 0);
  assert.equal(priceInCents(1000000), 100000000);
});
test("Digital cart: demo, hidden, unavailable, absent and changed products never retain stale prices", () => {
  const d = restaurantTestDesign(),
    id = d.items![0].id,
    entries = [{ id, quantity: 2 }];
  assert.equal(cartSummary(entries, d).totalCents, 8500);
  d.items![0].price = 11.9;
  assert.equal(cartSummary(entries, d).totalCents, 2380);
  d.items![0].available = false;
  assert.deepEqual(reconcileCart(entries, d), []);
  assert.equal(whatsappOrder("+5511999999999", entries, d, "").ok, false);
  d.items![0].available = true;
  d.items![0].demonstration = true;
  assert.equal(canOrder(d.items![0]), false);
  d.items![0].demonstration = false;
  d.categories![0].hidden = true;
  assert.deepEqual(changeCart([], id, 1, d), []);
  d.categories![0].hidden = false;
  assert.deepEqual(
    reconcileCart(
      [
        { id, quantity: 0 },
        { id: "missing", quantity: 1 },
      ],
      d,
    ),
    [],
  );
  assert.equal(
    whatsappOrder(
      "+5511999999999",
      [
        { id, quantity: 1 },
        { id, quantity: 1 },
      ],
      d,
      "",
    ).ok,
    false,
  );
  d.digital = { version: 1, maxQuantity: 1 };
  assert.deepEqual(reconcileCart(entries, d), [{ id, quantity: 1 }]);
  assert.equal(whatsappOrder("+5511999999999", entries, d, "").ok, false);
});
test("Digital WhatsApp: encoded message, confirmed number, estimates, note constraints and mandatory checks", () => {
  const d = restaurantTestDesign(),
    id = d.items![0].id;
  d.digital = {
    version: 1,
    copy: {
      whatsappIntroduction: "Olá, equipe!",
      whatsappConfirmation: "Confirmem por favor.",
      checkoutCta: "Consultar pedido",
    },
    showSubtotal: true,
  };
  const notes = "Sem cebola & molho à parte #1";
  const order = whatsappOrder(
    "+55 (11) 99999-9999",
    [{ id, quantity: 2 }],
    d,
    notes,
  );
  assert.equal(order.ok, true);
  if (order.ok) {
    const url = new URL(order.url);
    assert.equal(url.host, "wa.me");
    assert.equal(url.pathname, "/5511999999999");
    assert.equal(url.searchParams.get("text"), order.message);
    assert.match(order.message, /2x Produto de teste — R\$[^\n]*85,00/);
    assert.ok(order.message.includes(notes));
    assert.match(order.message, /Total estimado/);
    assert.match(order.message, /não confirma o pedido/);
    assert.match(order.message, /Confirmem por favor/);
    assert.ok(order.url.includes(encodeURIComponent(notes)));
  }
  for (const phone of [null, "11999999999", "abc", "+00000000"])
    assert.equal(whatsappOrder(phone, [{ id, quantity: 1 }], d, "").ok, false);
  assert.equal(whatsappOrder("+5511999999999", [], d, "").ok, false);
  assert.equal(
    whatsappOrder("+5511999999999", [{ id, quantity: 1 }], d, "x".repeat(501))
      .ok,
    false,
  );
  assert.equal(
    whatsappOrder("+5511999999999", [{ id, quantity: 1 }], d, "<script>").ok,
    false,
  );
  assert.equal(cleanNotes("a<script>\u0000b"), "ascriptb");
  assert.equal(cleanNotes("x".repeat(999)).length, 500);
  const emojiNotes = cleanNotes("x".repeat(499) + "🍔");
  assert.equal(emojiNotes.length, 500);
  assert.doesNotThrow(() => encodeURIComponent(emojiNotes));
  d.digital.showSubtotal = false;
  const without = whatsappOrder("+5511999999999", [{ id, quantity: 1 }], d, "");
  assert.ok(without.ok);
  if (without.ok) {
    assert.doesNotMatch(without.message, /Subtotal/);
    assert.match(without.message, /Total estimado/);
  }
});
test("Digital B: banner requires configured matching real category; optional sections and icons", () => {
  const p = restaurantFixture();
  p.restaurantDesign = restaurantTestDesign();
  const id = p.restaurantDesign.categories![0].id;
  assert.doesNotMatch(render(p), /class="rdBanner"/);
  p.restaurantDesign.digital = {
    version: 1,
    bannerCategoryId: id,
    brandIcon: "pizza",
    categoryIcons: [{ categoryId: id, icon: "pizza" }],
    copy: { bannerTitle: "Seleção confirmada", heroTitle: "Título editado" },
  };
  const html = render(p);
  assert.match(html, /class="rdBanner"/);
  assert.match(html, /Seleção confirmada/);
  assert.match(html, /lucide-pizza/);
  assert.match(html, /Título editado/);
  p.restaurantDesign.digital.sections = ["contact", "about"];
  assert.doesNotMatch(
    render(p),
    /href="#cardapio"|href="#como-pedir"|class="rdBanner"/,
  );
  p.restaurantDesign.digital.sections = ["menu", "banner"];
  p.restaurantDesign.items![0].demonstration = true;
  assert.doesNotMatch(render(p), /class="rdBanner"/);
});
test("Digital cart panel: real actions, notes, estimation, empty and invalid WhatsApp disabled", () => {
  const d = restaurantTestDesign(),
    entries = [{ id: d.items![0].id, quantity: 2 }];
  const props = {
    entries,
    design: d,
    phone: "+5511999999999",
    notes: "Sem cebola",
    onNotes: () => {},
    onChange: () => {},
    onRemove: () => {},
    onClear: () => {},
    id: "test",
  };
  const html = renderToStaticMarkup(createElement(CartPanel, props));
  for (const text of [
    "Diminuir quantidade",
    "Aumentar quantidade",
    "Remover Produto",
    "Limpar carrinho",
    "Observações",
    "Total estimado",
    'target="_blank"',
    "wa.me/5511999999999",
  ])
    assert.ok(html.includes(text), text);
  const invalid = renderToStaticMarkup(
    createElement(CartPanel, { ...props, phone: null }),
  );
  assert.doesNotMatch(invalid, /href="https:\/\/wa.me/);
  assert.match(invalid, /WhatsApp não configurado/);
  const empty = renderToStaticMarkup(
    createElement(CartPanel, { ...props, entries: [] }),
  );
  assert.match(empty, /Seu carrinho está vazio/);
  assert.doesNotMatch(empty, /href="https:\/\/wa.me/);
});
test("Digital B: editor, old JSONB compatibility, strict version, registry and Ver site", async () => {
  const p = restaurantFixture();
  assert.deepEqual(personalizationSchema.parse(p), p);
  p.restaurantDesign = restaurantTestDesign();
  p.restaurantDesign.digital = {
    version: 1,
    maxQuantity: 5,
    colors: { orange: "#F16B35" },
    images: { hero: { src: null, demonstration: true } },
    categoryIcons: [
      { categoryId: p.restaurantDesign.categories![0].id, icon: "pizza" },
    ],
  };
  assert.deepEqual(
    personalizationSchema.parse(JSON.parse(JSON.stringify(p))),
    p,
  );
  for (const digital of [
    { version: 2 },
    { version: 1, unknown: true },
    { version: 1, maxQuantity: 0 },
    { version: 1, maxQuantity: 1.5 },
    { version: 1, maxQuantity: 100 },
    { version: 1, colors: { orange: "red" } },
    { version: 1, copy: { heroTitle: "<script>" } },
    {
      version: 1,
      categoryIcons: [{ categoryId: randomUUID(), icon: "burger" }],
    },
    { version: 1, bannerCategoryId: randomUUID() },
    { version: 1, sections: ["menu", "menu"] },
    {
      version: 1,
      images: {
        hero: { src: "https://evil.test/x.jpg", demonstration: false },
      },
    },
  ])
    assert.equal(
      restaurantDesignSchema.safeParse({ version: 1, digital }).success,
      false,
    );
  const editor = renderToStaticMarkup(
    createElement(RestaurantControls, {
      variant: "B",
      value: p.restaurantDesign,
      onChange: () => {},
    }),
  );
  for (const text of [
    "Restaurantes B",
    "Adicionar produto",
    "Carrinho e integridade",
    "Mensagem inicial do WhatsApp",
    "Ícones das categorias",
  ])
    assert.ok(editor.includes(text));
  assert.equal(typeof rendererRegistry["restaurantes:B"].renderer, "function");
  assert.ok(
    await rendererRegistry["restaurantes:B"].renderer!({
      prototypeId: randomUUID(),
      slug: "teste",
      personalization: p,
    }),
  );
  const row: ManagedPrototype = {
    id: randomUUID(),
    lead_id: p.sourceLeadId,
    template_id: randomUUID(),
    niche: "restaurantes",
    variant: "B",
    slug: "teste",
    status: "draft",
    customization_data: p as unknown as Json,
    created_at: p.sourceUpdatedAt,
    updated_at: p.sourceUpdatedAt,
    published_at: null,
    revision: 1,
    company_name: p.confirmed.name,
    template_name: "Cardápio Digital",
    template_status: "active",
  };
  assert.match(
    renderToStaticMarkup(
      createElement(PrototypeTable, { items: [row], onInspect: () => {} }),
    ),
    /Visualizar prévia<\/a>/,
  );
  assert.notEqual(
    digitalRestaurantModel(restaurantFixture()).scope,
    digitalRestaurantModel(p).scope,
  );
});
test("Digital B: custom digital identity does not change the A renderer", () => {
  const p = restaurantFixture();
  p.restaurantDesign = restaurantTestDesign();
  const renderA = () =>
    renderToStaticMarkup(
      renderPersistedTemplate(
        { slug: "restaurantes-a", niche: "restaurantes", variant: "A" },
        p,
      ),
    );
  const before = renderA();
  p.restaurantDesign.digital = {
    version: 1,
    colors: { orange: "#FF0000" },
    copy: { heroTitle: "Título exclusivo B" },
    images: { hero: { src: null, demonstration: false } },
  };
  assert.equal(renderA(), before);
});
