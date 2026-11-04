import {
  Utensils,
  Hamburger,
  Pizza,
  Coffee,
  CupSoda,
  CakeSlice,
  Sandwich,
} from "lucide-react";
import type { digitalIcons } from "../../../lib/generation/restaurant-design";
export const foodIcons: Record<(typeof digitalIcons)[number], typeof Utensils> =
  {
    utensils: Utensils,
    burger: Hamburger,
    pizza: Pizza,
    coffee: Coffee,
    drink: CupSoda,
    dessert: CakeSlice,
    combo: Sandwich,
  };
