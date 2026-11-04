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
const asset = z
  .string()
  .regex(/^\/templates\/clinics\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$/);
export const appointmentPhotoSchema = z
  .object({
    src: asset.nullable(),
    position: z.enum(["center", "left", "right", "top", "bottom"]).optional(),
    caption: text(200).optional(),
    illustrative: z.boolean().optional(),
  })
  .strict();
export const appointmentSectionIds = [
  "services",
  "about",
  "process",
  "gallery",
  "conversion",
  "contact",
] as const;
export const appointmentContactIds = [
  "address",
  "phone",
  "whatsapp",
  "email",
  "hours",
  "instagram",
  "website",
] as const;
export const appointmentSteps = [
  {
    title: "Escolha o atendimento",
    description: "Conheça os serviços informados e encontre o que procura.",
  },
  {
    title: "Entre em contato",
    description: "Escolha um dos canais disponíveis para tirar suas dúvidas.",
  },
  {
    title: "Combine os detalhes",
    description:
      "Confirme disponibilidade e próximos passos diretamente com a clínica.",
  },
];
export const appointmentsDesignSchema = z
  .object({
    version: z.literal(1),
    primary: z.enum(["#004D50", "#244c45", "#414b64"]).optional(),
    secondary: z.enum(["#B8DDD6", "#dce8d8", "#dce2ef"]).optional(),
    button: z.enum(["#004D50", "#244c45", "#414b64"]).optional(),
    logo: asset.nullable().optional(),
    subtitle: text(160).optional(),
    heroTitle: text(255).optional(),
    heroDescription: text(500).optional(),
    cta: text(100).optional(),
    secondaryCta: text(100).optional(),
    servicesTitle: text(255).optional(),
    servicesDescription: text(500).optional(),
    servicesCta: text(100).optional(),
    serviceDescriptions: z.record(text(255).min(1), text(500)).optional(),
    aboutTitle: text(255).optional(),
    aboutDescription: text(2000).optional(),
    aboutCta: text(100).optional(),
    processTitle: text(255).optional(),
    processDescription: text(500).optional(),
    steps: z
      .array(
        z
          .object({ title: text(120).min(1), description: text(500).min(1) })
          .strict(),
      )
      .length(3)
      .optional(),
    structureTitle: text(255).optional(),
    structureDescription: text(500).optional(),
    conversionTitle: text(255).optional(),
    conversionDescription: text(500).optional(),
    conversionCta: text(100).optional(),
    contactTitle: text(255).optional(),
    contactDescription: text(500).optional(),
    footerDescription: text(500).optional(),
    heroImage: appointmentPhotoSchema.optional(),
    aboutImage: appointmentPhotoSchema.optional(),
    gallery: z.array(appointmentPhotoSchema).max(3).optional(),
    email: z.email().max(254).nullable().optional(),
    hours: text(500).nullable().optional(),
    hiddenContacts: z
      .array(z.enum(appointmentContactIds))
      .max(7)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
    contactChannel: z
      .enum(["auto", "whatsapp", "phone", "email", "instagram", "website"])
      .optional(),
    sections: z
      .array(z.enum(appointmentSectionIds))
      .max(6)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
  })
  .strict();
export type AppointmentsDesign = z.infer<typeof appointmentsDesignSchema>;
export type AppointmentPhoto = z.infer<typeof appointmentPhotoSchema>;
export type AppointmentSection = (typeof appointmentSectionIds)[number];
