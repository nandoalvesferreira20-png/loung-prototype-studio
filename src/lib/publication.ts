import { z } from "zod";
import {
  confirmedSchema,
  illustrativeSchema,
  clinicDesignSchema,
  personalizationSchema,
} from "./generation/contracts";
import { lawDesignSchema } from "./generation/law-design";
import { lawModernDesignSchema } from "./generation/law-modern-design";
import { realEstateDesignSchema } from "./generation/real-estate-design";
import { restaurantDesignSchema } from "./generation/restaurant-design";

export const publicDataSchema = z
  .object({
    version: z.literal(1),
    confirmed: confirmedSchema,
    illustrative: illustrativeSchema,
    clinicDesign: clinicDesignSchema.optional(),
    lawDesign: lawDesignSchema.optional(),
    lawModernDesign: lawModernDesignSchema.optional(),
    realEstateDesign: realEstateDesignSchema.optional(),
    restaurantDesign: restaurantDesignSchema.optional(),
  })
  .strict();
export type PublicData = z.infer<typeof publicDataSchema>;
export const publicKeys = [
  "confirmed",
  "illustrative",
  "clinicDesign",
  "lawDesign",
  "lawModernDesign",
  "realEstateDesign",
  "restaurantDesign",
] as const;
export const slugSchema = z
  .string()
  .max(160)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export function publicSnapshot(raw: unknown): PublicData {
  const data = personalizationSchema.parse(raw);
  return publicDataSchema.parse(
    Object.fromEntries([
      ["version", 1],
      ...publicKeys
        .filter((k) => data[k] !== undefined)
        .map((k) => [k, data[k]]),
    ]),
  );
}
// Compatibility envelope is synthetic, constructed only on the server. No private source identifier.
export function publicRendererInput(raw: unknown) {
  const data = publicDataSchema.parse(raw);
  const { version: _version, ...content } = data;
  void _version;
  return personalizationSchema.parse({
    ...content,
    schemaVersion: 1,
    sourceLeadId: "00000000-0000-4000-8000-000000000000",
    sourceUpdatedAt: "2000-01-01T00:00:00.000Z",
    confirmedOrigin: "admin_review",
    missingFields: Object.entries(data.confirmed)
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k),
  });
}
export function publicBaseUrl(value = process.env.STUDIO_PUBLIC_URL): string {
  if (!value)
    throw new Error("Configure STUDIO_PUBLIC_URL antes de compartilhar.");
  const url = new URL(value);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    (url.protocol !== "https:" &&
      !(
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)
      )) ||
    (process.env.NODE_ENV === "production" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
  )
    throw new Error("STUDIO_PUBLIC_URL inválida.");
  return url.origin;
}
export function publicLink(base: string, slug: string) {
  return `${base}/p/${slugSchema.parse(slug)}`;
}
export function sharingMessage(url: string) {
  return `Olá! Preparamos uma demonstração de como poderia ficar o site da sua empresa.\n\nVocê pode visualizar pelo link:\n${url}\n\nÉ uma proposta visual demonstrativa desenvolvida pela Loung Tech.`;
}
