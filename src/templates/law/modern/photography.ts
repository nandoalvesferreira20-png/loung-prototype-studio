import type {
  ModernPhoto,
  LawModernDesign,
} from "../../../lib/generation/law-modern-design";
export const modernPhotos: Record<
  "hero" | "about" | "professionals" | "contact",
  ModernPhoto
> = {
  hero: {
    src: "/templates/law/modern/hero-office.png",
    alt: "Referência arquitetônica de escritório contemporâneo com vidro e concreto claro",
    caption: "Ambiente conceitual · imagem ilustrativa",
    illustrative: true,
    position: "center",
  },
  about: {
    src: "/templates/law/modern/meeting-room.png",
    alt: "Referência de sala de reuniões contemporânea com luz natural",
    caption: "Sala de reuniões conceitual · imagem ilustrativa",
    illustrative: true,
    position: "center",
  },
  professionals: {
    src: null,
    alt: "Referência demonstrativa, não representa profissionais reais",
    illustrative: true,
  },
  contact: {
    src: "/templates/law/modern/contact-office.png",
    alt: "Referência de fachada corporativa contemporânea, sem marca",
    caption: "Arquitetura conceitual · imagem ilustrativa",
    illustrative: true,
    position: "center",
  },
};
export const modernPhoto = (
  d: LawModernDesign | undefined,
  slot: keyof typeof modernPhotos,
) => d?.images?.[slot] ?? modernPhotos[slot];
