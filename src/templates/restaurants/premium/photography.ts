import type { RestaurantPhoto } from "../../../lib/generation/restaurant-design";
export const restaurantPhotos = {
  hero: {
    src: "/templates/restaurants/shared/restaurant-dining-room.png",
    alt: "Referência de salão com luz quente e vegetação",
    demonstration: true,
  },
  gastronomy: {
    src: "/templates/restaurants/shared/restaurant-dish-closeup.png",
    alt: "Composição gastronômica ilustrativa, sem vínculo com o cardápio",
    demonstration: true,
  },
  history: {
    src: "/templates/restaurants/shared/restaurant-service.png",
    alt: "Cena ilustrativa de hospitalidade",
    demonstration: true,
  },
  contact: {
    src: "/templates/restaurants/shared/restaurant-bar-ambience.png",
    alt: "Referência visual de ambiente gastronômico",
    demonstration: true,
  },
} satisfies Record<
  "hero" | "gastronomy" | "history" | "contact",
  RestaurantPhoto
>;
export const restaurantGallery: RestaurantPhoto[] = [
  restaurantPhotos.hero,
  restaurantPhotos.contact,
  { ...restaurantPhotos.hero, position: "right" },
];
