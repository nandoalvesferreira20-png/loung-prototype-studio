import { requireAdminPage } from "@/lib/auth/server";
import { PageHeading, DemoNote } from "@/components/ui";
import { ImportWorkspace } from "@/components/imports/import-workspace";
export default async function ImportsPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeading
        eyebrow="NOVAS OPORTUNIDADES, NOVOS COMEÇOS"
        title="Importações."
        description="O caminho entre a sua lista de leads e o próximo projeto começa aqui."
      />
      <DemoNote />
      <ImportWorkspace />
    </>
  );
}
