import { z } from "zod";
export const estateText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Texto inválido.",
    );
export const estateAsset = z
  .string()
  .regex(
    /^\/templates\/real-estate\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/,
  );
export const estatePhotoSchema = z
  .object({
    src: estateAsset.nullable(),
    alt: estateText(300).optional(),
    position: z.enum(["center", "left", "right", "top", "bottom"]).optional(),
  })
  .strict();
export const propertyTypes = [
  "casa",
  "apartamento",
  "comercial",
  "terreno",
  "outro",
] as const;
export const propertyTypeLabels: Record<
  (typeof propertyTypes)[number],
  string
> = {
  casa: "Casas",
  apartamento: "Apartamentos",
  comercial: "Imóveis comerciais",
  terreno: "Terrenos",
  outro: "Outros imóveis",
};
const quantity = z.number().int().min(0).max(1000).nullable().optional();
export const propertySchema = z
  .object({
    id: z.uuid(),
    title: estateText(160).min(1),
    purpose: z.enum(["venda", "locacao"]),
    type: z.enum(propertyTypes),
    city: estateText(120).nullable().optional(),
    neighborhood: estateText(160).nullable().optional(),
    address: estateText(500).nullable().optional(),
    price: z.number().finite().min(0).max(1e12).nullable().optional(),
    area: z.number().finite().positive().max(1e9).nullable().optional(),
    bedrooms: quantity,
    bathrooms: quantity,
    parking: quantity,
    description: estateText(3000).optional(),
    images: z.array(estatePhotoSchema).max(10),
    status: z.enum([
      "disponivel",
      "reservado",
      "vendido",
      "alugado",
      "inativo",
    ]),
    featured: z.boolean(),
    demonstration: z.boolean(),
    additional: estateText(1000).optional(),
  })
  .strict()
  .refine(
    (p) =>
      p.demonstration ||
      p.images.every(
        (i) =>
          !i.src?.toLowerCase().startsWith("/templates/real-estate/shared/"),
      ),
    "Fotografias compartilhadas são ilustrativas; não podem anunciar imóvel real.",
  );
export const estateSections = [
  "properties",
  "about",
  "categories",
  "steps",
  "services",
  "editorial",
  "conversion",
  "contact",
] as const;
export const estateColors = {
  primary: "#142B35",
  olive: "#596A53",
  paper: "#F8F7F3",
  beige: "#EAE5DC",
  accent: "#C0A77B",
  white: "#FFFFFF",
  text: "#252B2B",
};
export const estateCopyKeys = [
  "heroTitle",
  "heroDescription",
  "heroPrimaryCta",
  "heroSecondaryCta",
  "propertiesTitle",
  "propertiesDescription",
  "emptyTitle",
  "emptyDescription",
  "aboutTitle",
  "aboutDescription",
  "aboutCta",
  "categoriesTitle",
  "categoriesDescription",
  "stepsTitle",
  "servicesTitle",
  "editorialTitle",
  "editorialDescription",
  "editorialCta",
  "conversionTitle",
  "conversionDescription",
  "conversionCta",
  "contactTitle",
  "contactDescription",
  "contactCta",
  "footerDescription",
] as const;
const copyShape = Object.fromEntries(
  estateCopyKeys.map((k) => [
    k,
    estateText(
      k.endsWith("Cta")
        ? 100
        : k.endsWith("Title")
          ? 255
          : k === "aboutDescription"
            ? 3000
            : 1000,
    ).optional(),
  ]),
) as Record<
  (typeof estateCopyKeys)[number],
  z.ZodOptional<ReturnType<typeof estateText>>
>;
export const realEstateDesignSchema = z
  .object({
    version: z.literal(1),
    personal: z
      .object({
        version: z.literal(1),
        name: estateText(255).optional(),
        heroHighlight: estateText(160).optional(),
        benefits: z
          .array(
            z
              .object({
                title: estateText(160).min(1),
                description: estateText(500),
              })
              .strict(),
          )
          .max(3)
          .optional(),
        portraits: z
          .object({
            hero: estatePhotoSchema
              .extend({ demonstration: z.boolean() })
              .optional(),
            about: estatePhotoSchema
              .extend({ demonstration: z.boolean() })
              .optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
    ...copyShape,
    leadType: z.enum(["agency", "broker"]).optional(),
    professionalLabel: estateText(160).optional(),
    creci: estateText(120).optional(),
    monogram: estateText(8).optional(),
    brandMark: z.enum(["building", "monogram", "none"]).optional(),
    logo: estateAsset.nullable().optional(),
    email: z.email().max(254).nullable().optional(),
    facebook: z
      .url()
      .max(2048)
      .refine(
        (v) =>
          /^https:\/\/(www\.)?facebook\.com([/?#]|$)/.test(v) &&
          !new URL(v).username &&
          !new URL(v).password,
      )
      .nullable()
      .optional(),
    typeface: z.enum(["editorial", "traditional"]).optional(),
    colors: z
      .object({
        primary: z.string(),
        olive: z.string(),
        paper: z.string(),
        beige: z.string(),
        accent: z.string(),
        white: z.string(),
        text: z.string(),
      })
      .partial()
      .strict()
      .refine((v) => Object.values(v).every((c) => /^#[0-9a-fA-F]{6}$/.test(c)))
      .optional(),
    images: z
      .object({
        hero: estatePhotoSchema.optional(),
        about: estatePhotoSchema.optional(),
        editorial: estatePhotoSchema.optional(),
        contact: estatePhotoSchema.optional(),
      })
      .strict()
      .optional(),
    categories: z
      .array(
        z
          .object({
            type: z.enum(propertyTypes),
            hidden: z.boolean().optional(),
            image: estatePhotoSchema.optional(),
          })
          .strict(),
      )
      .max(5)
      .refine((v) => new Set(v.map((i) => i.type)).size === v.length)
      .optional(),
    steps: z
      .array(
        z
          .object({
            title: estateText(160).min(1),
            description: estateText(500),
          })
          .strict(),
      )
      .max(3)
      .optional(),
    sections: z
      .array(z.enum(estateSections))
      .max(8)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
    properties: z
      .array(propertySchema)
      .max(48)
      .refine((v) => new Set(v.map((i) => i.id)).size === v.length)
      .optional(),
  })
  .strict()
  .refine(
    (v) => new TextEncoder().encode(JSON.stringify(v)).length <= 400000,
    "Catálogo excede 400 KB.",
  );
export type RealEstateDesign = z.infer<typeof realEstateDesignSchema>;
export type EstateProperty = z.infer<typeof propertySchema>;
export type EstatePhoto = z.infer<typeof estatePhotoSchema>;
export type EstateSection = (typeof estateSections)[number];
