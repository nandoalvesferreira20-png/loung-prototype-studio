import { personalizationSchema } from "../../../lib/generation/contracts";
import { telephoneLink, whatsappLink } from "../../clinics/shared/adapter";
export function lawMonogram(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(
      (w) =>
        !new Set([
          "de",
          "da",
          "do",
          "das",
          "dos",
          "e",
          "&",
          "advocacia",
          "advogados",
          "advogado",
          "advogada",
          "escritório",
          "sociedade",
        ]).has(w.toLocaleLowerCase("pt-BR")),
    );
  return (
    words.length > 1
      ? words
          .slice(0, 2)
          .map((w) => Array.from(w)[0])
          .join("")
      : Array.from(words[0] || name)
          .slice(0, 2)
          .join("")
  ).toLocaleUpperCase("pt-BR");
}
export function lawModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  if (data.confirmed.niche !== "advocacia")
    throw new Error("incompatible_template_niche");
  const c = data.confirmed,
    d = data.lawDesign;
  const location = [c.address, [c.city, c.state].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" · ");
  const solo = d?.leadType === "solo";
  const headline =
    d?.heroTitle ||
    (data.illustrative.headline ===
    "Clareza na apresentação dos serviços jurídicos"
      ? solo
        ? "Informação e proximidade para compreender sua necessidade jurídica."
        : "Conheça o escritório e sua atuação no Direito."
      : data.illustrative.headline);
  const introduction = data.illustrative.introduction.startsWith(
    "Texto-base demonstrativo para a apresentação institucional.",
  )
    ? `Encontre as informações de ${c.name}, conheça as áreas de atuação informadas e consulte os canais disponíveis para contato.`
    : data.illustrative.introduction;
  return {
    ...c,
    design: d,
    solo,
    headline,
    about: d?.aboutDescription || c.description || introduction,
    location,
    monogram: d?.monogram || lawMonogram(c.name),
    maps: location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : null,
    telephone: telephoneLink(c.phone),
    whatsappUrl: whatsappLink(c.whatsapp),
    instagramUrl: c.instagram,
    websiteUrl: c.website,
    areas: c.services.filter((area) => !d?.areaDetails?.[area]?.hidden),
    team: d?.team?.filter((p) => p.authorized) ?? [],
  };
}
export type LawModel = ReturnType<typeof lawModel>;
