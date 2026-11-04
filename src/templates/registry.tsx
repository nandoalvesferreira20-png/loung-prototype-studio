import { PersonalEstate } from "./real-estate/personal";
import { PremiumRestaurant } from "./restaurants/premium";
import { DigitalRestaurant } from "./restaurants/digital";
import { digitalRestaurantModel } from "./restaurants/digital/model";
import { restaurantModel } from "./restaurants/premium/model";
import { PremiumEstate } from "./real-estate/premium";
import { estateModel } from "./real-estate/premium/model";
import type { TemplateRow } from "../types/database";
import { ModernLaw } from "./law/modern";
import { modernLawModel } from "./law/modern/model";
import { ClassicLaw } from "./law/classic";
import { lawModel } from "./law/classic/model";
import { clinicModel } from "./clinics/shared/adapter";
import { PremiumClinic } from "./clinics/premium";
import { AppointmentsClinic } from "./clinics/appointments";

// Slugs do catálogo persistido; UUIDs são resolvidos pela relação template_id.
export const templateRenderers = {
  "restaurantes-b": {
    niche: "restaurantes",
    variant: "B",
    component: DigitalRestaurant,
  },
  "restaurantes-a": {
    niche: "restaurantes",
    variant: "A",
    component: PremiumRestaurant,
  },
  "imobiliarias-b": {
    niche: "imobiliarias",
    variant: "B",
    component: PersonalEstate,
  },
  "imobiliarias-a": {
    niche: "imobiliarias",
    variant: "A",
    component: PremiumEstate,
  },
  "advocacia-b": { niche: "advocacia", variant: "B", component: ModernLaw },
  "advocacia-a": { niche: "advocacia", variant: "A", component: ClassicLaw },
  "clinicas-a": { niche: "clinicas", variant: "A", component: PremiumClinic },
  "clinicas-b": {
    niche: "clinicas",
    variant: "B",
    component: AppointmentsClinic,
  },
} as const;
export function renderPersistedTemplate(
  template: Pick<TemplateRow, "slug" | "niche" | "variant">,
  personalization: unknown,
) {
  const entry =
    templateRenderers[template.slug as keyof typeof templateRenderers];
  if (
    !entry ||
    entry.niche !== template.niche ||
    entry.variant !== template.variant
  )
    throw new Error("renderer_unavailable");
  if (entry.niche === "restaurantes") {
    if (entry.variant === "B") {
      const model = digitalRestaurantModel(personalization);
      return <DigitalRestaurant key={model.scope} model={model} />;
    }
    return <PremiumRestaurant model={restaurantModel(personalization)} />;
  }
  if (entry.niche === "imobiliarias")
    return entry.variant === "B" ? (
      <PersonalEstate model={estateModel(personalization)} />
    ) : (
      <PremiumEstate model={estateModel(personalization)} />
    );
  if (entry.niche === "advocacia")
    return entry.variant === "B" ? (
      <ModernLaw model={modernLawModel(personalization)} />
    ) : (
      <ClassicLaw model={lawModel(personalization)} />
    );
  const Component = entry.component;
  return <Component model={clinicModel(personalization)} />;
}
