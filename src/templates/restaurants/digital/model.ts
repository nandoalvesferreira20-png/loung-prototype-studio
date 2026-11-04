import { personalizationSchema } from "../../../lib/generation/contracts";
import { restaurantModel } from "../premium/model";
import { digitalCatalog } from "./cart";
export function digitalRestaurantModel(input: unknown) {
  const data = personalizationSchema.parse(input);
  return {
    ...restaurantModel(data),
    scope: data.sourceLeadId,
    items: digitalCatalog(data.restaurantDesign),
  };
}
export type DigitalRestaurantModel = ReturnType<typeof digitalRestaurantModel>;
