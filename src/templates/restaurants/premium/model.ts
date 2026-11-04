import { personalizationSchema } from "../../../lib/generation/contracts";
import { telephoneLink, whatsappLink } from "../../clinics/shared/adapter";
import type { RestaurantDesign } from "../../../lib/generation/restaurant-design";
export function visibleRestaurantItems(d: RestaurantDesign | undefined) {
  const hidden = new Set(
    d?.categories?.filter((c) => c.hidden).map((c) => c.id),
  );
  return (d?.items ?? [])
    .filter((i) => i.available && (!i.categoryId || !hidden.has(i.categoryId)))
    .sort(
      (a, b) => Number(b.featured) - Number(a.featured) || a.order - b.order,
    );
}
export function restaurantPrice(price: number | null) {
  return price == null
    ? null
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(price);
}
export function restaurantModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  if (data.confirmed.niche !== "restaurantes")
    throw new Error("incompatible_template_niche");
  const c = data.confirmed,
    d = data.restaurantDesign;
  const telephone = telephoneLink(c.phone),
    whatsapp = whatsappLink(c.whatsapp);
  return {
    confirmed: c,
    design: d,
    telephone,
    whatsapp,
    contact:
      whatsapp ||
      telephone ||
      (d?.email ? `mailto:${d.email}` : null) ||
      c.website ||
      c.instagram,
    location: [c.address, [c.city, c.state].filter(Boolean).join(" / ")]
      .filter(Boolean)
      .join(" · "),
    monogram: c.name
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0])
      .join("")
      .toUpperCase(),
    items: visibleRestaurantItems(d),
  };
}
export type RestaurantModel = ReturnType<typeof restaurantModel>;
