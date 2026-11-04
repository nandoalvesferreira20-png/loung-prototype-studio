import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicSite } from "@/services/publication";
import { publicRendererInput } from "@/lib/publication";
import {
  renderPersistedTemplate,
  templateRenderers,
} from "@/templates/registry";
import "@/templates/real-estate/premium/premium.css";
import "@/templates/real-estate/personal/personal.css";
import "@/templates/restaurants/premium/premium.css";
import "@/templates/restaurants/digital/digital.css";
import "@/templates/clinics/clinics.css";
import "@/templates/clinics/premium/premium.css";
import "@/templates/clinics/appointments/appointments.css";
import "@/templates/law/classic/classic.css";
import "@/templates/law/modern/modern.css";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const site = await getPublicSite((await params).slug);
  const title = site
    ? `${site.public_data.confirmed.name} · Demonstração`
    : "Demonstração indisponível";
  const description =
    site?.public_data.confirmed.description ??
    "Protótipo demonstrativo desenvolvido pela Loung Tech.";
  return {
    title,
    description,
    robots: { index: false, follow: false, noarchive: true },
    icons: { icon: "/assets/brand/loung-tech-lt.png" },
    openGraph: { title, description, type: "website" },
  };
}
export default async function PublicSite({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const site = await getPublicSite((await params).slug);
  if (!site) notFound();
  const template =
    templateRenderers[
      site.template_identifier as keyof typeof templateRenderers
    ];
  if (!template || template.niche !== site.public_data.confirmed.niche)
    notFound();
  let page;
  try {
    page = renderPersistedTemplate(
      {
        slug: site.template_identifier,
        niche: template.niche,
        variant: template.variant,
      },
      publicRendererInput(site.public_data),
    );
  } catch {
    notFound();
  }
  return (
    <>
      {page}
      <footer
        style={{
          padding: "14px 24px",
          textAlign: "center",
          fontSize: 12,
          background: "#F1EEE6",
          color: "#000",
        }}
      >
        Protótipo demonstrativo desenvolvido pela Loung Tech. Proposta
        conceitual; imagens ilustrativas não representam necessariamente o
        estabelecimento.
      </footer>
    </>
  );
}
