import { z } from "zod";

export const restaurantText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/.test(v),
      "Use texto simples, sem conteúdo ativo.",
    );
export const restaurantAsset = z
  .string()
  .regex(
    /^\/templates\/restaurants\/([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$/,
  );
export const restaurantPhotoSchema = z
  .object({
    src: restaurantAsset.nullable(),
    alt: restaurantText(300).optional(),
    position: z.enum(["center", "left", "right", "top", "bottom"]).optional(),
    demonstration: z.boolean(),
    caption: restaurantText(160).optional(),
  })
  .strict()
  .refine(
    (p) =>
      !p.src?.toLowerCase().startsWith("/templates/restaurants/shared/") ||
      p.demonstration,
    "Assets compartilhados são referências ilustrativas.",
  );
export const restaurantColors = {
  forest: "#18382D",
  dark: "#14241D",
  cream: "#F7F2E9",
  beige: "#E7DDCE",
  gold: "#BDA477",
  white: "#FFFFFF",
  brown: "#49382D",
};
export const restaurantSections = [
  "introduction",
  "gastronomy",
  "menu",
  "history",
  "gallery",
  "conversion",
  "contact",
] as const;
export const restaurantSectionLabels = {
  introduction: "Introdução",
  gastronomy: "Gastronomia",
  menu: "Cardápio",
  history: "Nossa História",
  gallery: "Ambiente",
  conversion: "Faixa de contato",
  contact: "Informações",
};
export const restaurantCopy = {
  heroTitle: "Sabores que transformam momentos em experiências.",
  heroDescription:
    "Um convite para conhecer nossa proposta e descobrir novos sabores.",
  heroPrimaryCta: "Conheça o Cardápio",
  heroSecondaryCta: "Nosso Ambiente",
  introductionTitle: "Mais do que uma refeição, uma experiência para apreciar.",
  introductionDescription:
    "Conheça a proposta do estabelecimento e os canais disponíveis para conversar sobre sua próxima visita.",
  gastronomyTitle: "O sabor está em cada detalhe.",
  gastronomyDescription:
    "Conheça nossa proposta gastronômica. Consulte o cardápio e os canais de atendimento para saber mais.",
  gastronomyCta: "Explore Nosso Cardápio",
  menuTitle: "Uma seleção para despertar os sentidos.",
  emptyTitle: "Uma apresentação para abrir o apetite.",
  emptyDescription:
    "O cardápio ainda não foi cadastrado. Esta fotografia é uma referência ilustrativa e não representa um prato vendido pelo estabelecimento.",
  historyTitle: "Cada encontro merece ser especial.",
  historyDescription:
    "Conheça o estabelecimento e sua proposta. Entre em contato para saber mais e planejar sua visita.",
  historyCta: "Converse com a equipe",
  galleryTitle: "Um ambiente para viver bons momentos.",
  conversionTitle: "Momentos especiais começam à mesa.",
  conversionDescription:
    "Converse com a equipe e conheça as informações para sua visita.",
  conversionCta: "Entre em Contato",
  contactTitle: "Venha conhecer",
  contactDescription:
    "Consulte os canais de atendimento e compartilhe suas dúvidas.",
  contactCta: "Falar pelo WhatsApp",
  footerDescription: "Conheça nossa proposta e os canais de atendimento.",
};
export const restaurantCopyLabels: Record<keyof typeof restaurantCopy, string> =
  {
    heroTitle: "Título do hero",
    heroDescription: "Descrição do hero",
    heroPrimaryCta: "CTA do cardápio",
    heroSecondaryCta: "CTA do ambiente",
    introductionTitle: "Título da introdução",
    introductionDescription: "Texto da introdução",
    gastronomyTitle: "Título da gastronomia",
    gastronomyDescription: "Texto da gastronomia",
    gastronomyCta: "CTA da gastronomia",
    menuTitle: "Título do cardápio",
    emptyTitle: "Título sem cardápio",
    emptyDescription: "Texto sem cardápio",
    historyTitle: "Título da história",
    historyDescription: "História confirmada / apresentação",
    historyCta: "CTA da história",
    galleryTitle: "Título da galeria",
    conversionTitle: "Título da faixa",
    conversionDescription: "Texto da faixa",
    conversionCta: "CTA da faixa",
    contactTitle: "Título de contato",
    contactDescription: "Texto de contato",
    contactCta: "CTA de contato",
    footerDescription: "Texto do rodapé",
  };
const copyShape = Object.fromEntries(
  Object.keys(restaurantCopy).map((k) => [
    k,
    restaurantText(
      k.endsWith("Cta") ? 100 : k.endsWith("Title") ? 255 : 2000,
    ).optional(),
  ]),
) as Record<
  keyof typeof restaurantCopy,
  z.ZodOptional<ReturnType<typeof restaurantText>>
>;
export const restaurantCategorySchema = z
  .object({
    id: z.uuid(),
    name: restaurantText(120).min(1),
    hidden: z.boolean(),
    order: z.number().int().min(0).max(999),
  })
  .strict();
export const digitalColors = {
  graphite: "#191919",
  ink: "#252525",
  orange: "#FF6B35",
  cream: "#FFF8EF",
  white: "#FFFFFF",
  whatsapp: "#238B28",
  gray: "#F1F0ED",
};
export const digitalSections = [
  "menu",
  "banner",
  "steps",
  "about",
  "contact",
] as const;
export const digitalIcons = [
  "utensils",
  "burger",
  "pizza",
  "coffee",
  "drink",
  "dessert",
  "combo",
] as const;
export const digitalCopy = {
  eyebrow: "Feito para quem ama comer bem",
  heroTitle: "Seu próximo pedido favorito começa aqui.",
  heroHighlight: "favorito",
  heroDescription:
    "Explore o cardápio, escolha seus favoritos e consulte seu pedido de um jeito simples.",
  heroPrimaryCta: "Ver Cardápio",
  heroSecondaryCta: "Como Pedir",
  categoriesTitle: "O que você está com vontade de comer?",
  menuTitle: "Escolha seus favoritos.",
  menuDescription: "Conheça os produtos cadastrados e monte sua seleção.",
  featuredTitle: "Em destaque no cardápio.",
  emptyTitle: "O próximo sabor começa com uma conversa.",
  emptyDescription:
    "O cardápio ainda não tem produtos cadastrados para exibir. A equipe pode adicionar produtos, fotos e valores confirmados no Studio.",
  cartTitle: "Seu pedido, do seu jeito.",
  checkoutCta: "Finalizar pelo WhatsApp",
  whatsappIntroduction:
    "Olá! Gostaria de consultar a disponibilidade deste pedido:",
  whatsappConfirmation:
    "Gostaria de confirmar os valores e a disponibilidade dos itens.",
  bannerTitle: "Seu favorito, do seu jeito.",
  bannerCta: "Explorar seleção",
  stepsTitle: "Pedir é simples.",
  aboutTitle: "Boa comida, bons momentos.",
  aboutDescription:
    "Conheça o estabelecimento e sua proposta. Fale com a equipe pelos canais disponíveis para esclarecer suas dúvidas.",
  aboutCta: "Conheça o atendimento",
  contactTitle: "Vamos encontrar seu próximo pedido?",
  contactDescription:
    "Fale com a equipe e consulte as informações de atendimento.",
  footerDescription: "Conheça o cardápio e os canais de atendimento.",
};
const digitalCopyShape = Object.fromEntries(
  Object.keys(digitalCopy).map((k) => [
    k,
    restaurantText(
      k.endsWith("Cta")
        ? 100
        : k.endsWith("Title")
          ? 255
          : k === "whatsappIntroduction" || k === "whatsappConfirmation"
            ? 500
            : 1000,
    ).optional(),
  ]),
) as Record<
  keyof typeof digitalCopy,
  z.ZodOptional<ReturnType<typeof restaurantText>>
>;
export const restaurantDigitalSchema = z
  .object({
    version: z.literal(1),
    typeface: z.enum(["modern", "rounded"]).optional(),
    brandIcon: z.enum(digitalIcons).optional(),
    colors: z
      .object({
        graphite: z.string(),
        ink: z.string(),
        orange: z.string(),
        cream: z.string(),
        white: z.string(),
        whatsapp: z.string(),
        gray: z.string(),
      })
      .partial()
      .strict()
      .refine((v) => Object.values(v).every((c) => /^#[0-9a-fA-F]{6}$/.test(c)))
      .optional(),
    copy: z.object(digitalCopyShape).strict().optional(),
    benefits: z
      .array(
        z
          .object({
            title: restaurantText(160).min(1),
            description: restaurantText(500),
          })
          .strict(),
      )
      .max(4)
      .optional(),
    showBenefits: z.boolean().optional(),
    steps: z
      .array(
        z
          .object({
            title: restaurantText(160).min(1),
            description: restaurantText(500),
          })
          .strict(),
      )
      .max(3)
      .optional(),
    sections: z
      .array(z.enum(digitalSections))
      .max(5)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
    categoryIcons: z
      .array(
        z.object({ categoryId: z.uuid(), icon: z.enum(digitalIcons) }).strict(),
      )
      .max(16)
      .refine((v) => new Set(v.map((i) => i.categoryId)).size === v.length)
      .optional(),
    bannerCategoryId: z.uuid().nullable().optional(),
    bannerImage: restaurantPhotoSchema.optional(),
    images: z
      .object({
        hero: restaurantPhotoSchema.optional(),
        about: restaurantPhotoSchema.optional(),
        contact: restaurantPhotoSchema.optional(),
      })
      .strict()
      .optional(),
    maxQuantity: z.number().int().min(1).max(99).optional(),
    showSubtotal: z.boolean().optional(),
  })
  .strict();
export const restaurantItemSchema = z
  .object({
    id: z.uuid(),
    name: restaurantText(160).min(1),
    description: restaurantText(1000),
    categoryId: z.uuid().nullable(),
    image: restaurantPhotoSchema.optional(),
    price: z.number().finite().min(0).max(1000000).nullable(),
    available: z.boolean(),
    featured: z.boolean(),
    order: z.number().int().min(0).max(999),
    demonstration: z.boolean(),
  })
  .strict()
  .refine(
    (p) => p.demonstration || !p.image?.src || !p.image.demonstration,
    "Prato real exige fotografia própria; referências ilustrativas somente em exemplos demonstrativos.",
  );
export const restaurantDesignSchema = z
  .object({
    version: z.literal(1),
    digital: restaurantDigitalSchema.optional(),
    subtitle: restaurantText(160).optional(),
    symbol: z.enum(["botanical", "monogram", "none"]).optional(),
    logo: restaurantAsset.nullable().optional(),
    typeface: z.enum(["editorial", "classic"]).optional(),
    segment: z
      .enum([
        "restaurant",
        "pizzeria",
        "burger",
        "japanese",
        "bistro",
        "cafe",
        "other",
      ])
      .optional(),
    email: z.email().max(254).nullable().optional(),
    openingHours: restaurantText(1000).optional(),
    colors: z
      .object({
        forest: z.string(),
        dark: z.string(),
        cream: z.string(),
        beige: z.string(),
        gold: z.string(),
        white: z.string(),
        brown: z.string(),
      })
      .partial()
      .strict()
      .refine((v) => Object.values(v).every((c) => /^#[0-9a-fA-F]{6}$/.test(c)))
      .optional(),
    copy: z.object(copyShape).strict().optional(),
    images: z
      .object({
        hero: restaurantPhotoSchema.optional(),
        gastronomy: restaurantPhotoSchema.optional(),
        history: restaurantPhotoSchema.optional(),
        contact: restaurantPhotoSchema.optional(),
      })
      .strict()
      .optional(),
    gallery: z.array(restaurantPhotoSchema).max(12).optional(),
    categories: z
      .array(restaurantCategorySchema)
      .max(16)
      .refine((v) => new Set(v.map((c) => c.id)).size === v.length)
      .optional(),
    items: z
      .array(restaurantItemSchema)
      .max(60)
      .refine((v) => new Set(v.map((i) => i.id)).size === v.length)
      .optional(),
    menuLimit: z.number().int().min(1).max(24).optional(),
    sections: z
      .array(z.enum(restaurantSections))
      .max(7)
      .refine((v) => new Set(v).size === v.length)
      .optional(),
  })
  .strict()
  .superRefine((d, ctx) => {
    const categoryIds = new Set(d.categories?.map((c) => c.id));
    if (
      d.digital?.bannerCategoryId &&
      !categoryIds.has(d.digital.bannerCategoryId)
    )
      ctx.addIssue({
        code: "custom",
        path: ["digital", "bannerCategoryId"],
        message: "Categoria do banner não cadastrada.",
      });
    for (const [index, icon] of (d.digital?.categoryIcons ?? []).entries())
      if (!categoryIds.has(icon.categoryId))
        ctx.addIssue({
          code: "custom",
          path: ["digital", "categoryIcons", index],
          message: "Categoria do ícone não cadastrada.",
        });
    for (const [index, item] of (d.items ?? []).entries())
      if (
        item.categoryId &&
        !d.categories?.some((c) => c.id === item.categoryId)
      )
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "categoryId"],
          message: "Categoria não cadastrada.",
        });
    if (new TextEncoder().encode(JSON.stringify(d)).length > 250000)
      ctx.addIssue({ code: "custom", message: "Cardápio excede 250 KB." });
  });
export type RestaurantDesign = z.infer<typeof restaurantDesignSchema>;
export type RestaurantPhoto = z.infer<typeof restaurantPhotoSchema>;
export type RestaurantItem = z.infer<typeof restaurantItemSchema>;
export type RestaurantCategory = z.infer<typeof restaurantCategorySchema>;
export type RestaurantSection = (typeof restaurantSections)[number];
export type RestaurantDigital = z.infer<typeof restaurantDigitalSchema>;
