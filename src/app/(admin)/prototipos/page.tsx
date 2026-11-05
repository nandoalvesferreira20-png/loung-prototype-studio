import { requireAdminPage } from "@/lib/auth/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { PrototypeList } from "@/components/prototypes/prototype-list";
import { GenerationPanel } from "@/components/prototypes/generation-panel";
import { generationLeadsAction, prototypeListAction } from "./actions";
import { listPersistedTemplates } from "@/services/database";
import { getPrivatePreview } from "@/services/preview";
import { publicBaseUrl } from "@/lib/publication";
export const maxDuration = 30;
export default async function PrototypesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireAdminPage();
  let publicBase: string | null = null;
  try {
    publicBase = publicBaseUrl();
  } catch {
    /* Public links remain unavailable until configured. */
  }
  const edit = (await searchParams).edit;
  const target = edit ? await getPrivatePreview(edit) : null;
  const initialSelected = target
    ? {
        ...target.prototype,
        company_name: "Empresa",
        template_name: target.template.name,
        variant: target.template.variant,
        template_status: target.template.status,
      }
    : undefined;
  const [leads, prototypes, templates] = await Promise.all([
    generationLeadsAction({ query: "", niche: "", page: 0 }),
    prototypeListAction({
      query: "",
      niche: "",
      status: "",
      templateId: "",
      page: 0,
    }),
    listPersistedTemplates(),
  ]);
  const items = prototypes.ok ? prototypes.data : { items: [], total: 0 };
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
      <GenerationPanel
        initial={leads.ok ? leads.data : { items: [], total: 0, eligible: 0 }}
        error={leads.ok ? undefined : leads.message}
      />
      <PrototypeList
        publicBase={publicBase}
        initialSelected={initialSelected}
        key={`${items.total}:${items.items.map((i) => `${i.id}:${i.revision}:${i.publication?.publication_version ?? 0}`).join(",")}`}
        initial={items}
        templates={templates}
        error={prototypes.ok ? undefined : prototypes.message}
      />
      <p className="page-footnote">
        Um protótipo por lead. Dados privados, com revisão administrativa e sem
        publicação automática.
      </p>
    </>
  );
}
