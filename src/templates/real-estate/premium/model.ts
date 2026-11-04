import { personalizationSchema } from "../../../lib/generation/contracts";
import { telephoneLink, whatsappLink } from "../../clinics/shared/adapter";
export function estateModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  if (data.confirmed.niche !== "imobiliarias")
    throw new Error("incompatible_template_niche");
  const c = data.confirmed,
    d = data.realEstateDesign;
  return {
    confirmed: c,
    design: d,
    telephone: telephoneLink(c.phone),
    whatsapp: whatsappLink(c.whatsapp),
    location: [c.address, [c.city, c.state].filter(Boolean).join(" / ")]
      .filter(Boolean)
      .join(" · "),
    monogram:
      d?.monogram ||
      c.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
        .toUpperCase(),
  };
}
export type EstateModel = ReturnType<typeof estateModel>;
