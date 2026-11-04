import { randomUUID } from "node:crypto";
import type { Personalization } from "../../src/lib/generation/contracts";
import type {
  RestaurantItem,
  RestaurantDesign,
} from "../../src/lib/generation/restaurant-design";
import { demonstrationContent } from "../../src/lib/generation/personalize";
export function restaurantFixture(
  values: Partial<Personalization["confirmed"]> = {},
): Personalization {
  const confirmed: Personalization["confirmed"] = {
    name: "Restaurante de teste",
    niche: "restaurantes",
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
    illustrative: demonstrationContent.restaurantes,
    missingFields: Object.entries(confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k) as Personalization["missingFields"],
  };
}
export function restaurantTestItem(
  values: Partial<RestaurantItem> = {},
): RestaurantItem {
  return {
    id: randomUUID(),
    name: "Produto de teste",
    description: "Descrição confirmada no teste",
    categoryId: null,
    price: null,
    available: true,
    featured: false,
    order: 0,
    demonstration: false,
    ...values,
  };
}
export function restaurantTestDesign(): RestaurantDesign {
  const categoryId = randomUUID();
  return {
    version: 1,
    segment: "bistro",
    email: "teste@example.com",
    openingHours: "Horário confirmado para o teste",
    categories: [
      { id: categoryId, name: "Categoria de teste", hidden: false, order: 0 },
    ],
    items: [
      restaurantTestItem({
        categoryId,
        price: 42.5,
        image: {
          src: "/templates/restaurants/products/foto-autorizada.webp",
          alt: "Fotografia própria",
          demonstration: false,
          position: "top",
        },
      }),
    ],
    gallery: [],
    colors: { forest: "#17382D" },
    copy: { heroTitle: "Título configurado" },
  };
}
