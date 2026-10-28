import { requireAdminPage } from "@/lib/auth/server";
import { PageHeading } from "@/components/ui";
import { SettingsPanel } from "@/components/settings/settings-panel";
export default async function SettingsPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeading
        eyebrow="DO SEU JEITO, NO SEU TEMPO"
        title="Configurações."
        description="Conheça as preferências do Studio e a estrutura que vai acompanhar seu crescimento."
      />
      <SettingsPanel />
    </>
  );
}
