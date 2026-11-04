export type PremiumPhoto = Readonly<{
  src: string;
  alt: string;
  width: number;
  height: number;
  position: string;
}>;
export type PremiumPhotography = Readonly<
  Record<"hero" | "institutional" | "detail", PremiumPhoto | null>
>;
export function localPhoto(file: string, alt: string): PremiumPhoto {
  return {
    src: `/templates/clinics/shared/${file}.png`,
    alt: `${alt}; não representa esta clínica`,
    width:
      file === "consultation-detail" || file === "doctor-consultation-main"
        ? 1122
        : 1448,
    height:
      file === "consultation-detail" || file === "doctor-consultation-main"
        ? 1402
        : 1086,
    position: "center",
  };
}
export const roomPhoto = localPhoto(
  "clinic-room-structure",
  "Referência de consultório",
);
export const premiumPhotography: PremiumPhotography = {
  hero: localPhoto("clinic-reception-hero", "Referência de recepção"),
  institutional: localPhoto(
    "doctor-consultation-main",
    "Situação ilustrativa de atendimento, não representa profissionais da empresa",
  ),
  detail: localPhoto("consultation-detail", "Detalhe ilustrativo de consulta"),
};
