import { personalizationSchema } from "../../../lib/generation/contracts";
import { resolveSpecialty, specialties } from "./specialties";

export function telephoneLink(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15
    ? `tel:${value.startsWith("+") ? "+" : ""}${digits}`
    : null;
}
export function whatsappLink(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  // Sem inferir país: o número deve ter prefixo internacional explícito.
  const explicitInternational = value.startsWith("+") || digits.length >= 12;
  return explicitInternational && /^[1-9]\d{7,14}$/.test(digits)
    ? `https://wa.me/${digits}`
    : null;
}
export function clinicModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  if (data.confirmed.niche !== "clinicas")
    throw new Error("incompatible_template_niche");
  const confirmed = data.confirmed;
  const specialtyId = resolveSpecialty(confirmed.specialty);
  const specialty = specialties[specialtyId];
  const location = [
    confirmed.address,
    [confirmed.city, confirmed.state].filter(Boolean).join(" / "),
  ]
    .filter(Boolean)
    .join(" · ");
  return {
    ...confirmed,
    design: data.clinicDesign,
    specialtyId,
    art: specialty,
    image: `/templates/clinics/${specialtyId}.svg`,
    illustrative: data.illustrative,
    location,
    maps: location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
      : null,
    telephone: telephoneLink(confirmed.phone),
    whatsappUrl: whatsappLink(confirmed.whatsapp),
    instagramUrl: confirmed.instagram
      ? new URL(confirmed.instagram).href
      : null,
    websiteUrl: confirmed.website ? new URL(confirmed.website).href : null,
  };
}
export type ClinicModel = ReturnType<typeof clinicModel>;
