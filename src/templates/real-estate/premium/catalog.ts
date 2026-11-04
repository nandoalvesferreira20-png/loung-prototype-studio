import type { EstateProperty } from "../../../lib/generation/real-estate-design";
export type PropertyFilters = {
  purpose: "" | "venda" | "locacao";
  type: string;
  location: string;
  price: "" | "under500" | "500to1m" | "1to3m" | "over3m";
};
export const emptyFilters: PropertyFilters = {
  purpose: "",
  type: "",
  location: "",
  price: "",
};
const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function filterProperties(
  properties: EstateProperty[],
  f: PropertyFilters,
) {
  return properties.filter(
    (p) =>
      p.status !== "inativo" &&
      (!f.purpose || p.purpose === f.purpose) &&
      (!f.type || p.type === f.type) &&
      (!f.location ||
        normalize([p.city, p.neighborhood].filter(Boolean).join(" ")).includes(
          normalize(f.location),
        )) &&
      (!f.price ||
        (p.price != null &&
          (f.price === "under500"
            ? p.price <= 500000
            : f.price === "500to1m"
              ? p.price > 500000 && p.price <= 1000000
              : f.price === "1to3m"
                ? p.price > 1000000 && p.price <= 3000000
                : p.price > 3000000))),
  );
}
export function propertyPrice(p: Pick<EstateProperty, "price" | "purpose">) {
  return p.price == null
    ? null
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      }).format(p.price) + (p.purpose === "locacao" ? " / mês" : "");
}
