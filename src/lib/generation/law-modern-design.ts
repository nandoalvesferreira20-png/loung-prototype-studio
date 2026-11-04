import { z } from "zod";
import { lawAsset, lawDesignSchema, lawTeamSchema } from "./law-design";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Texto contém caracteres de controle.",
    );
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const modernLink = z
  .url()
  .max(2048)
  .refine((v) => {
    const u = new URL(v);
    return (
      ["https:", "http:"].includes(u.protocol) && !u.username && !u.password
    );
  }, "Use uma URL HTTP(S) sem credenciais.");
export const modernPhotoSchema = z
  .object({
    src: lawAsset
      .refine(
        (v) => !v.toLowerCase().startsWith("/templates/law/shared/"),
        "Escolha fotografia própria do B, não o pacote clássico.",
      )
      .nullable(),
    position: z.enum(["center", "left", "right", "top", "bottom"]).optional(),
    alt: text(300).optional(),
    caption: text(200).optional(),
    illustrative: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      !(
        v.src?.toLowerCase().startsWith("/templates/law/modern/") &&
        v.illustrative === false
      ),
    "O pacote moderno gerado é ilustrativo; use outro diretório para fotos reais autorizadas.",
  );
export const modernSections = [
  "manifesto",
  "areas",
  "about",
  "team",
  "conversion",
  "contact",
] as const;
export const modernColors = {
  primary: "#102D43",
  secondary: "#193C56",
  accent: "#62788B",
  paper: "#F6F6F3",
  white: "#FFFFFF",
  line: "#E8EBED",
  text: "#202A32",
};
export const lawModernDesignSchema = lawDesignSchema
  .omit({
    features: true,
    showFeatures: true,
    editorialTitle: true,
    editorialDescription: true,
    images: true,
    colors: true,
    typeface: true,
    team: true,
    areaDetails: true,
    sections: true,
    heroSecondaryCta: true,
  })
  .extend({
    brandMark: z.enum(["monogram", "geometry", "none"]).optional(),
    colors: z
      .object({
        primary: color,
        secondary: color,
        accent: color,
        paper: color,
        white: color,
        line: color,
        text: color,
      })
      .partial()
      .strict()
      .optional(),
    typeface: z.enum(["geometric", "humanist"]).optional(),
    manifestoTitle: text(255).optional(),
    manifestoDescription: text(2000).optional(),
    areaDetails: z
      .record(
        text(255).min(1),
        z
          .object({
            description: text(1000).optional(),
            hidden: z.boolean().optional(),
            href: modernLink.optional(),
          })
          .strict(),
      )
      .optional(),
    team: z
      .array(lawTeamSchema.safeExtend({ profileUrl: modernLink.optional() }))
      .max(24)
      .optional(),
    conversionTitle: text(255).optional(),
    conversionDescription: text(1000).optional(),
    conversionCta: text(100).optional(),
    images: z
      .object({
        hero: modernPhotoSchema.optional(),
        about: modernPhotoSchema.optional(),
        professionals: modernPhotoSchema.optional(),
        contact: modernPhotoSchema.optional(),
      })
      .strict()
      .optional(),
    sections: z
      .array(z.enum(modernSections))
      .max(6)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
  })
  .strict();
export type LawModernDesign = z.infer<typeof lawModernDesignSchema>;
export type ModernPhoto = z.infer<typeof modernPhotoSchema>;
export type ModernSection = (typeof modernSections)[number];
