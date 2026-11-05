import { realEstateDesignSchema } from "./real-estate-design";
import { restaurantDesignSchema } from "./restaurant-design";
import { z } from "zod";
import { lawModernDesignSchema } from "./law-modern-design";
import { lawDesignSchema } from "./law-design";
import { appointmentsDesignSchema } from "./appointments-design";
import { nicheIds, urlKind } from "../imports/model";
import type { PrototypeRow } from "../../types/database";
export const GENERATION_LIMITS = {
  batchSize: 25,
  maxSelection: 500,
  pageSize: 25,
} as const;
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Texto contém caracteres de controle.",
    );
const optionalText = (max: number) => text(max).min(1).nullable();
const optionalPhone = optionalText(60).refine(
  (v) => v === null || /^\+?[0-9 ()\-.\/]{3,60}$/.test(v),
  "Telefone inválido; preserve prefixos e zeros.",
);
const optionalUrl = (kind: "website" | "instagram") =>
  optionalText(2048).refine(
    (v) => v === null || urlKind(v) === kind,
    "URL HTTP(S) incompatível com o campo.",
  );
export const confirmedSchema = z
  .object({
    name: text(255).min(1),
    niche: z.enum(nicheIds),
    specialty: optionalText(120),
    city: optionalText(120),
    state: optionalText(2).refine(
      (v) => v === null || /^[A-Z]{2}$/.test(v),
      "UF inválida.",
    ),
    address: optionalText(500),
    phone: optionalPhone,
    whatsapp: optionalPhone,
    website: optionalUrl("website"),
    instagram: optionalUrl("instagram"),
    description: optionalText(2000),
    services: z.array(text(255).min(1)).max(50),
  })
  .strict();
export const illustrativeSchema = z
  .object({
    label: z.literal("Conteúdo de demonstração"),
    headline: text(255).min(1),
    introduction: text(2000).min(1),
    plannedSections: z.array(text(120).min(1)).min(1).max(12),
  })
  .strict();
const assetPath = z
  .string()
  .regex(/^\/templates\/clinics\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$/);
export const clinicDesignSchema = z
  .object({
    version: z.literal(1),
    appointments: appointmentsDesignSchema.optional(),
    primary: z.enum(["#405638", "#244c45", "#414b64"]).optional(),
    secondary: z.enum(["#faf8f5", "#f2f5f3", "#f6f5fa"]).optional(),
    button: z.enum(["#405638", "#244c45", "#414b64"]).optional(),
    logo: assetPath.nullable().optional(),
    subtitle: text(160).optional(),
    heroDescription: text(500).optional(),
    aboutTitle: text(255).optional(),
    servicesTitle: text(255).optional(),
    serviceDescriptions: z.record(text(255).min(1), text(500)).optional(),
    structureTitle: text(255).optional(),
    contactTitle: text(255).optional(),
    cta: text(100).optional(),
    images: z
      .object({
        hero: assetPath.nullable().optional(),
        institutional: assetPath.nullable().optional(),
        detail: assetPath.nullable().optional(),
        room: assetPath.nullable().optional(),
      })
      .strict()
      .optional(),
    positions: z
      .object({
        hero: z.enum(["center", "left", "right"]).optional(),
        institutional: z.enum(["center", "left", "right"]).optional(),
        detail: z.enum(["center", "left", "right"]).optional(),
        room: z.enum(["center", "left", "right"]).optional(),
      })
      .strict()
      .optional(),
    sections: z
      .array(z.enum(["services", "about", "structure", "contact"]))
      .max(4)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
    reviews: z
      .array(
        z
          .object({
            name: text(120).min(1),
            quote: text(1000).min(1),
            source: z
              .url()
              .refine((value) => /^https?:\/\//.test(value), "Use HTTP(S)."),
            authorized: z.literal(true),
          })
          .strict(),
      )
      .max(12)
      .optional(),
  })
  .strict();
export type ClinicDesign = z.infer<typeof clinicDesignSchema>;
export const personalizationSchema = z
  .object({
    schemaVersion: z.literal(1),
    realEstateDesign: realEstateDesignSchema.optional(),
    restaurantDesign: restaurantDesignSchema.optional(),
    clinicDesign: clinicDesignSchema.optional(),
    lawDesign: lawDesignSchema.optional(),
    lawModernDesign: lawModernDesignSchema.optional(),
    sourceLeadId: z.uuid(),
    sourceUpdatedAt: z.string().datetime({ offset: true }),
    confirmedOrigin: z.enum(["lead_snapshot", "admin_review"]),
    confirmed: confirmedSchema,
    illustrative: illustrativeSchema,
    missingFields: z
      .array(
        z.enum(
          Object.keys(confirmedSchema.shape) as [
            keyof typeof confirmedSchema.shape,
            ...(keyof typeof confirmedSchema.shape)[],
          ],
        ),
      )
      .max(12),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.restaurantDesign && value.confirmed.niche !== "restaurantes")
      ctx.addIssue({
        code: "custom",
        path: ["restaurantDesign"],
        message: "Cardápio exige nicho Restaurantes.",
      });
    if (value.realEstateDesign && value.confirmed.niche !== "imobiliarias")
      ctx.addIssue({
        code: "custom",
        path: ["realEstateDesign"],
        message: "Catálogo exige nicho Imobiliárias.",
      });
    if (value.lawModernDesign && value.confirmed.niche !== "advocacia")
      ctx.addIssue({
        code: "custom",
        path: ["lawModernDesign"],
        message: "Opções jurídicas exigem Advocacia.",
      });
    if (value.lawDesign && value.confirmed.niche !== "advocacia")
      ctx.addIssue({
        code: "custom",
        path: ["lawDesign"],
        message: "Opções jurídicas exigem o nicho Advocacia.",
      });
    const missing = Object.entries(value.confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([key]) => key)
      .sort();
    if (
      JSON.stringify([...value.missingFields].sort()) !==
      JSON.stringify(missing)
    )
      ctx.addIssue({
        code: "custom",
        path: ["missingFields"],
        message: "Campos ausentes devem corresponder aos dados confirmados.",
      });
  });
export type Personalization = z.infer<typeof personalizationSchema>;
export type TemplateInput = Readonly<{
  prototypeId: string;
  slug: string;
  personalization: Personalization;
}>;
export const generationModeSchema = z.enum(["auto", "A", "B"]);
export type GenerationMode = z.infer<typeof generationModeSchema>;
export const generationPreviewSchema = z
  .object({
    leadIds: z
      .array(z.uuid())
      .min(1)
      .max(GENERATION_LIMITS.maxSelection)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Seleção contém leads repetidos.",
      ),
    mode: generationModeSchema,
  })
  .strict();
export const generationSelectionSchema = z
  .object({
    leadIds: z
      .array(z.uuid())
      .min(1)
      .max(GENERATION_LIMITS.batchSize)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Seleção contém leads repetidos.",
      ),
    mode: generationModeSchema,
  })
  .strict();
export const generationCommitSchema = generationSelectionSchema
  .extend({
    requestId: z.uuid(),
    expectedPlan: z.string().regex(/^[a-f0-9]{32}$/),
  })
  .strict();
export const prototypeEditSchema = z
  .object({
    id: z.uuid(),
    expectedRevision: z.number().int().positive(),
    templateId: z.uuid(),
    personalization: personalizationSchema,
  })
  .strict();
export const leadFilterSchema = z
  .object({
    query: text(100),
    niche: z.union([z.enum(nicheIds), z.literal("")]),
    page: z.number().int().min(0).max(100000),
  })
  .strict();
export type LeadFilter = z.infer<typeof leadFilterSchema>;
export const planItemSchema = z.object({
  leadId: z.uuid(),
  name: z.string(),
  niche: z.enum(nicheIds).nullable(),
  leadUpdatedAt: z.string().nullable(),
  templateId: z.uuid().nullable(),
  variant: z.enum(["A", "B"]).nullable(),
  status: z.enum(["eligible", "existing", "blocked"]),
  reason: z.string().nullable(),
});
export const generationPlanSchema = z.object({
  selected: z.number(),
  eligible: z.number(),
  ignored: z.number(),
  blocked: z.number(),
  items: z.array(planItemSchema),
  fingerprint: z.string(),
});
export type GenerationPlan = z.infer<typeof generationPlanSchema>;
export const generationResultSchema = z.object({
  requestId: z.uuid(),
  created: z.number(),
  ignored: z.number(),
  prototypes: z.array(
    z.object({
      id: z.uuid(),
      leadId: z.uuid(),
      templateId: z.uuid(),
      variant: z.enum(["A", "B"]),
      niche: z.enum(nicheIds),
      slug: z.string(),
    }),
  ),
});
export type GenerationResult = z.infer<typeof generationResultSchema>;
export type GenerationLead = {
  id: string;
  name: string;
  niche: (typeof nicheIds)[number];
  city: string | null;
  state: string | null;
  hasPrototype: boolean;
};
export type GenerationLeadPage = {
  items: GenerationLead[];
  total: number;
  eligible: number;
};
export type ManagedPrototype = PrototypeRow & {
  publication?: {
    slug?: string;
    publication_version: number;
    source_revision: number;
    published_at: string;
    unpublished_at: string | null;
  } | null;
  publicationUnavailable?: boolean;
  company_name: string;
  template_name: string;
  variant: "A" | "B";
  template_status: "planned" | "active" | "archived";
};
export type PrototypePage = { items: ManagedPrototype[]; total: number };
export const prototypeFilterSchema = leadFilterSchema
  .extend({
    status: z.enum(["", "draft", "review", "published", "unpublished"]),
    templateId: z.union([z.uuid(), z.literal("")]),
  })
  .strict();
export type PrototypeFilter = z.infer<typeof prototypeFilterSchema>;
