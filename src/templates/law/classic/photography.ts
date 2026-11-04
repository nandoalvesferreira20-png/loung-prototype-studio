import type { LawDesign, LawPhoto } from "../../../lib/generation/law-design";
export const lawPhotos: Record<
  "hero" | "about" | "editorial" | "contact",
  LawPhoto
> = {
  hero: {
    src: "/templates/law/shared/law-office-reception.png",
    caption: "Recepção · referência visual",
    illustrative: true,
    position: "right",
  },
  about: {
    src: "/templates/law/shared/law-meeting-room.png",
    caption: "Sala de reuniões · referência visual",
    illustrative: true,
    position: "center",
  },
  editorial: {
    src: "/templates/law/shared/law-legal-details.png",
    caption: "Composição jurídica ilustrativa",
    illustrative: true,
    position: "center",
  },
  contact: {
    src: "/templates/law/shared/law-client-consultation.png",
    caption:
      "Situação ilustrativa de atendimento · não representa profissionais do escritório",
    illustrative: true,
    position: "center",
  },
};
export function resolveLawPhoto(
  d: LawDesign | undefined,
  slot: keyof typeof lawPhotos,
) {
  return d?.images?.[slot] ?? lawPhotos[slot];
}
export function isBrandedReception(src: string | null) {
  return (
    src?.replace(/\/+/g, "/").toLowerCase() ===
    "/templates/law/shared/law-office-reception.png"
  );
}
