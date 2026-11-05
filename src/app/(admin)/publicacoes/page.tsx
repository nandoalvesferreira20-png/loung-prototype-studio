import { requireAdminPage } from "@/lib/auth/server";
import { listPersistedTemplates } from "@/services/database";
import { PublicationCenter } from "@/components/prototypes/publication-center";
import { initialCenterFilters, publicationIds } from "@/lib/publication-center";
import { listPublications } from "./actions";
export const maxDuration = 30;
export const metadata = {
  title: "Central de Publicação",
  robots: { index: false, follow: false },
};
export default async function Publications({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  await requireAdminPage();
  const params = await searchParams;
  const ids = params.ids
    ? publicationIds.safeParse(params.ids.split(","))
    : null;
  const filters = {
    ...initialCenterFilters,
    ...(ids?.success ? { ids: ids.data } : {}),
  };
  const [initial, templates] = await Promise.all([
    listPublications(filters),
    listPersistedTemplates(),
  ]);
  return (
    <PublicationCenter
      initial={initial}
      templates={templates}
      initialFilters={filters}
      invalidSelection={!!params.ids && !ids?.success}
    />
  );
}
