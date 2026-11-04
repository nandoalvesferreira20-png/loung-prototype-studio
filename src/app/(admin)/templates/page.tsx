import { requireAdminPage } from "@/lib/auth/server";
import { PageHeading } from "@/components/ui";
import { TemplateLibrary } from "@/components/templates/template-library";
export default async function TemplatesPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeading
        eyebrow="O PONTO DE PARTIDA CERTO"
        title="Biblioteca de templates."
        description="Oito pontos de partida com identidade própria. Escolha um nicho e explore as variantes disponíveis para prévia privada."
      />
      <div className="catalog-summary">
        <span>
          <b>04</b> nichos oficiais
        </span>
        <span>
          <b>08</b> templates no catálogo
        </span>
        <span>
          <b>A + B</b> duas variantes por nicho
        </span>
        <span className="planned-pill">Oito templates disponíveis</span>
      </div>
      <TemplateLibrary />
    </>
  );
}
