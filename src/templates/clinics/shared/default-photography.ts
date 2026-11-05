import type { SpecialtyId } from "./specialties";

// Clinical consultation photos are reserved for general medicine. Other
// specialties use the existing neutral interiors, never an absent default.
export function clinicDefaultPhoto(file: string, specialty: SpecialtyId) {
  if (specialty !== "general") {
    const waiting =
      file === "clinic-reception-hero" || file === "clinic-room-structure";
    return {
      src: `/templates/clinics/premium/${waiting ? "waiting-area" : "warm-interior"}.jpg`,
      width: waiting ? 1600 : 1800,
      height: waiting ? 2133 : 2700,
      caption: waiting
        ? "Referência ilustrativa de recepção"
        : "Referência ilustrativa de ambiente",
    };
  }
  const portrait =
    file === "doctor-consultation-main" || file === "consultation-detail";
  return {
    src: `/templates/clinics/shared/${file}.png`,
    width: portrait ? 1122 : 1448,
    height: portrait ? 1402 : 1086,
    caption: "Referência ilustrativa de atendimento e ambiente",
  };
}
