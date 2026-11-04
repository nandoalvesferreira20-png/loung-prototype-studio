import type { NicheId, Variant } from "../../types/domain";
import type { TemplateInput } from "./contracts";
// Chaves do catálogo persistido. O motor não importa componentes visuais.
export const rendererRegistry = Object.fromEntries(
  (["clinicas", "advocacia", "imobiliarias", "restaurantes"] as const).flatMap(
    (niche) =>
      (["A", "B"] as const).map((variant) => [
        `${niche}:${variant}`,
        {
          niche,
          variant,
          renderer:
            niche === "clinicas" ||
            niche === "advocacia" ||
            niche === "imobiliarias" ||
            niche === "restaurantes"
              ? async (input: TemplateInput) => {
                  const { renderPersistedTemplate } =
                    await import("../../templates/registry");
                  return renderPersistedTemplate(
                    {
                      slug: `${niche}-${variant.toLowerCase()}`,
                      niche,
                      variant,
                    },
                    input.personalization,
                  );
                }
              : null,
        },
      ]),
  ),
) as Record<
  `${NicheId}:${Variant}`,
  {
    niche: NicheId;
    variant: Variant;
    renderer: ((input: TemplateInput) => unknown) | null;
  }
>;
