import { requireAdminPage } from "@/lib/auth/server";
import { PageHeading } from "@/components/ui";
import { ImportWorkspace } from "@/components/imports/import-workspace";
import { ImportHistory } from "@/components/imports/import-history";
import { listPersistedImports } from "@/services/database";
export default async function ImportsPage() {
  await requireAdminPage();
  const imports = await listPersistedImports();
  return (
    <>
      <PageHeading
        eyebrow="NOVAS OPORTUNIDADES, NOVOS COMEÇOS"
        title="Importações."
        description="O caminho entre a sua lista de leads e o próximo projeto começa aqui."
      />
      <ImportWorkspace />
      <ImportHistory items={imports} />
    </>
  );
}
