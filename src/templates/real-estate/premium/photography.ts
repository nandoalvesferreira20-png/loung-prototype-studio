import type { EstatePhoto } from "../../../lib/generation/real-estate-design";
export const estatePhotos: Record<
  "hero" | "about" | "editorial" | "contact",
  EstatePhoto
> = {
  hero: {
    src: "/templates/real-estate/shared/real-estate-luxury-house-hero.png",
    alt: "Residência contemporânea ao entardecer",
  },
  about: {
    src: "/templates/real-estate/shared/real-estate-property-tour.png",
    alt: "Exemplo de apresentação de um ambiente",
  },
  editorial: {
    src: "/templates/real-estate/shared/real-estate-apartment-interior.png",
    alt: "Interior residencial com luz natural",
  },
  contact: {
    src: "/templates/real-estate/shared/real-estate-client-consultation.png",
    alt: "Cena ilustrativa de atendimento imobiliário",
  },
};
