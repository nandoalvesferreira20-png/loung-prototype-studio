import { z } from "zod";
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v),
      "Texto contém caracteres de controle.",
    );
export const lawAsset = z
  .string()
  .regex(
    /^\/templates\/law\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/,
  );
export const lawIcons = [
  "scale",
  "building",
  "briefcase",
  "home",
  "users",
  "file",
  "handshake",
  "book",
] as const;
export const lawSections = [
  "about",
  "areas",
  "editorial",
  "team",
  "contact",
] as const;
export const lawPhotoSchema = z
  .object({
    src: lawAsset.nullable(),
    position: z.enum(["center", "left", "right", "top", "bottom"]).optional(),
    caption: text(200).optional(),
    illustrative: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) =>
      !(
        v.src?.toLowerCase().startsWith("/templates/law/shared/") &&
        v.illustrative === false
      ),
    "O pacote compartilhado é ilustrativo e não pode ser identificado como fotografia real.",
  );
const teamPhoto = z
  .string()
  .regex(
    /^\/templates\/law\/team\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/,
  );
export const lawTeamSchema = z
  .object({
    name: text(160).min(1),
    role: text(160).optional(),
    area: text(255).optional(),
    registration: text(120).optional(),
    description: text(1000).optional(),
    photo: teamPhoto.nullable().optional(),
    photoAuthorized: z.literal(true).optional(),
    authorized: z.literal(true),
  })
  .strict()
  .refine(
    (v) => !v.photo || v.photoAuthorized === true,
    "Confirme que a fotografia é real e autorizada pelo profissional.",
  );
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const lawDesignSchema = z
  .object({
    version: z.literal(1),
    leadType: z.enum(["office", "solo"]).optional(),
    monogram: text(8).optional(),
    logo: lawAsset
      .nullable()
      .optional()
      .refine(
        (v) =>
          v?.toLowerCase() !== "/templates/law/shared/law-office-reception.png",
        "Escolha um logotipo autorizado, não a recepção com marca fictícia.",
      ),
    professionalLabel: text(160).optional(),
    colors: z
      .object({
        primary: color,
        secondary: color,
        paper: color,
        accent: color,
        text: color,
        muted: color,
      })
      .partial()
      .strict()
      .optional(),
    typeface: z.enum(["editorial", "traditional"]).optional(),
    heroTitle: text(255).optional(),
    heroDescription: text(1000).optional(),
    heroPrimaryCta: text(100).optional(),
    heroSecondaryCta: text(100).optional(),
    aboutTitle: text(255).optional(),
    aboutDescription: text(3000).optional(),
    aboutCta: text(100).optional(),
    features: z
      .array(
        z
          .object({
            title: text(160).min(1),
            icon: z.enum(lawIcons),
            target: z.enum(["about", "areas", "contact"]),
          })
          .strict(),
      )
      .max(3)
      .optional(),
    showFeatures: z.boolean().optional(),
    areasTitle: text(255).optional(),
    areasDescription: text(1000).optional(),
    areasCta: text(100).optional(),
    areaDetails: z
      .record(
        text(255).min(1),
        z
          .object({
            description: text(1000).optional(),
            icon: z.enum(lawIcons).optional(),
            hidden: z.boolean().optional(),
          })
          .strict(),
      )
      .optional(),
    editorialTitle: text(255).optional(),
    editorialDescription: text(2000).optional(),
    teamTitle: text(255).optional(),
    team: z.array(lawTeamSchema).max(24).optional(),
    contactTitle: text(255).optional(),
    contactDescription: text(1000).optional(),
    contactCta: text(100).optional(),
    email: z.email().max(254).nullable().optional(),
    linkedin: z
      .url()
      .max(2048)
      .refine((v) => {
        try {
          const u = new URL(v);
          return (
            u.protocol === "https:" &&
            !u.username &&
            !u.password &&
            ["linkedin.com", "www.linkedin.com"].includes(u.hostname)
          );
        } catch {
          return false;
        }
      }, "Use uma URL HTTPS válida do LinkedIn.")
      .nullable()
      .optional(),
    footerDescription: text(1000).optional(),
    images: z
      .object({
        hero: lawPhotoSchema.optional(),
        about: lawPhotoSchema.optional(),
        editorial: lawPhotoSchema.optional(),
        contact: lawPhotoSchema.optional(),
      })
      .strict()
      .optional(),
    sections: z
      .array(z.enum(lawSections))
      .max(5)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
  })
  .strict();
export type LawDesign = z.infer<typeof lawDesignSchema>;
export type LawPhoto = z.infer<typeof lawPhotoSchema>;
export type LawSection = (typeof lawSections)[number];
export type LawTeamMember = z.infer<typeof lawTeamSchema>;
export const lawDefaultColors = {
  primary: "#17191B",
  secondary: "#292C30",
  paper: "#F7F4EF",
  accent: "#B59A65",
  text: "#17191B",
  muted: "#777A7D",
};
