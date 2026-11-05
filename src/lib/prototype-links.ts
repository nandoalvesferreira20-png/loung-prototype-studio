import { publicBaseUrl, publicLink } from "./publication";
import { z } from "zod";

export function previewUrl(id: string) {
  return z.uuid().safeParse(id).success ? `/prototipos/${id}/preview` : null;
}

export function activePrototypeUrl(
  base: string | null,
  slug: string,
  active: boolean,
) {
  if (!active || !base) return null;
  try {
    return publicLink(publicBaseUrl(base), slug);
  } catch {
    return null;
  }
}

export const OPEN_LINK_PAGE_SIZE = 5;
export async function copyPrototypeLink(
  base: string | null,
  slug: string,
  active: boolean,
  writeText: (url: string) => Promise<void>,
) {
  const url = activePrototypeUrl(base, slug, active);
  if (!url) return false;
  await writeText(url);
  return true;
}
export type OpeningLink = { id: string; company: string; url: string };
export function openingSelection(
  selected: { id: string; name: string }[],
  confirmed: OpeningLink[],
) {
  const ids = new Set(selected.map((item) => item.id));
  const links = [
    ...new Map(
      confirmed
        .filter((item) => ids.has(item.id))
        .map((item) => [item.id, item]),
    ).values(),
  ];
  return {
    links,
    omitted: selected
      .filter((item) => !links.some((link) => link.id === item.id))
      .map((item) => item.name),
    total: selected.length,
  };
}
export function generatedPrototypeGroups(ids: string[]) {
  const unique = [...new Set(ids)].filter(
    (id) => z.uuid().safeParse(id).success,
  );
  return Array.from({ length: Math.ceil(unique.length / 25) }, (_, index) =>
    unique.slice(index * 25, (index + 1) * 25),
  );
}
