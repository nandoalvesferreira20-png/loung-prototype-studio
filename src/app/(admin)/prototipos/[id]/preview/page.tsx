import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrivatePreview } from "@/services/preview";
import { PreviewFrame } from "@/components/prototypes/preview-frame";
import { PublicationPanel } from "@/components/prototypes/publication-panel";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Prévia privada",
  robots: { index: false, follow: false },
};
export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPrivatePreview(id);
  if (!data) notFound();
  return (
    <>
      <Link href="/prototipos" className="button">
        ← Voltar aos protótipos
      </Link>
      <div style={{ margin: "24px 0" }}>
        <h1>Prévia do site</h1>
        <p>
          {data.template.name} · revisão {data.prototype.revision} · acesso
          administrativo
        </p>
      </div>
      <PublicationPanel id={id} />
      <PreviewFrame id={id} revision={data.prototype.revision} />
    </>
  );
}
