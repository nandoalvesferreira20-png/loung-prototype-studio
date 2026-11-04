import "@/templates/real-estate/premium/premium.css";
import "@/templates/restaurants/premium/premium.css";
import "@/templates/restaurants/digital/digital.css";
import "@/templates/real-estate/personal/personal.css";
import { notFound } from "next/navigation";
import { getPrivatePreview } from "@/services/preview";
import { renderPersistedTemplate } from "@/templates/registry";
import "@/templates/clinics/clinics.css";
import "@/templates/clinics/premium/premium.css";
import "@/templates/clinics/appointments/appointments.css";
import "@/templates/law/classic/classic.css";
import "@/templates/law/modern/modern.css";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Demonstração privada",
  robots: { index: false, follow: false },
};
export default async function PrivateSite({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const data = await getPrivatePreview((await params).id);
  if (!data) notFound();
  let page;
  try {
    page = renderPersistedTemplate(
      data.template,
      data.prototype.customization_data,
    );
  } catch {
    return (
      <main style={{ padding: 40 }}>
        <h1>Prévia indisponível</h1>
        <p>
          Este template ainda não possui renderizador ou os dados precisam ser
          revisados no painel.
        </p>
      </main>
    );
  }
  return page;
}
