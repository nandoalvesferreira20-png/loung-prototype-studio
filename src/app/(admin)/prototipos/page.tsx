import { requireAdminPage } from "@/lib/auth/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { DemoNote, PageHeading } from "@/components/ui";
import { PrototypeList } from "@/components/prototypes/prototype-list";
export default async function PrototypesPage() {
  await requireAdminPage();
  return (
    <>
      <PageHeading
        eyebrow="DA IDEIA À PRESENÇA DIGITAL"
        title="Seus protótipos."
        description="Um ponto de partida único para cada empresa. Explore e organize seus projetos."
        action={
          <Link href="/importacoes" className="button primary">
            <Plus size={17} />
            Nova importação
          </Link>
        }
      />
      <DemoNote />
      <PrototypeList />
      <p className="page-footnote">
        Um protótipo por lead. A troca manual de template será disponibilizada
        junto ao motor de geração.
      </p>
    </>
  );
}
