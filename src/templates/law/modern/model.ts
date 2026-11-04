import { personalizationSchema } from "../../../lib/generation/contracts";
import { lawMonogram } from "../classic/model";
import { telephoneLink, whatsappLink } from "../../clinics/shared/adapter";
export function modernLawModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  if (data.confirmed.niche !== "advocacia")
    throw new Error("incompatible_template_niche");
  const c = data.confirmed,
    d = data.lawModernDesign;
  const location = [c.address, [c.city, c.state].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" · ");
  return {
    ...c,
    design: d,
    solo: d?.leadType === "solo",
    monogram: d?.monogram || lawMonogram(c.name),
    headline:
      d?.heroTitle ||
      (data.illustrative.headline ===
      "Clareza na apresentação dos serviços jurídicos"
        ? "Clareza jurídica para decisões importantes."
        : data.illustrative.headline),
    about:
      d?.aboutDescription ||
      c.description ||
      (data.illustrative.introduction.startsWith("Texto-base demonstrativo")
        ? `Conheça as informações de ${c.name}, as áreas de atuação confirmadas e os canais disponíveis para contato.`
        : data.illustrative.introduction),
    areas: c.services.filter((a) => !d?.areaDetails?.[a]?.hidden),
    team: d?.team?.filter((p) => p.authorized) ?? [],
    location,
    maps: location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : null,
    telephone: telephoneLink(c.phone),
    whatsappUrl: whatsappLink(c.whatsapp),
    instagramUrl: c.instagram,
    websiteUrl: c.website,
  };
}
export type ModernLawModel = ReturnType<typeof modernLawModel>;
