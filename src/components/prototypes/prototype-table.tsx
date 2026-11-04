import { Eye, Layers3 } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";
import { niches } from "@/config/catalog";
import { formatDate } from "@/lib/prototypes";
import { rendererRegistry } from "@/lib/generation/registry";
import {
  personalizationSchema,
  type ManagedPrototype,
} from "@/lib/generation/contracts";
export const prototypeStatusLabels = {
  draft: "Rascunho privado",
  review: "Em revisão",
  published: "Publicado",
  unpublished: "Despublicado",
} as const;
export function PrototypeTable({
  items,
  onInspect,
  publication,
}: {
  items: ManagedPrototype[];
  onInspect: (item: ManagedPrototype) => void;
  publication?: (id: string) => ReactNode;
}) {
  return (
    <div
      className="table-scroll"
      tabIndex={0}
      role="region"
      aria-label="Protótipos com rolagem horizontal"
    >
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Nicho / template</th>
            <th>Status</th>
            <th>Criado em</th>
            <th>Identificador reservado</th>
            <th>Gerenciar</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const personalization = personalizationSchema.safeParse(
              item.customization_data,
            );
            const name = personalization.success
              ? personalization.data.confirmed.name
              : item.company_name;
            return (
              <tr key={item.id}>
                <td>
                  <div className="company-cell">
                    <span className={`company-icon niche-${item.niche}`}>
                      {name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <small>
                        {personalization.success
                          ? (personalization.data.confirmed.specialty ??
                            "Sem especialidade informada")
                          : "Registro anterior"}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong className="table-niche">
                    {niches.find((n) => n.id === item.niche)?.shortName}
                  </strong>
                  <small>
                    {item.template_name} · {item.variant}
                  </small>
                </td>
                <td>
                  <small>
                    {item.publicationUnavailable
                      ? "Publicação indisponível"
                      : item.publication
                        ? item.publication.unpublished_at
                          ? "Despublicado"
                          : "Site público ativo"
                        : "Nunca publicado"}
                  </small>
                  {item.publication && (
                    <small>
                      v{item.publication.publication_version} ·{" "}
                      {formatDate(item.publication.published_at)}
                      {item.publication.source_revision !== item.revision
                        ? " · Alterações não publicadas"
                        : ""}
                    </small>
                  )}
                  <span
                    className={`badge status-${item.status === "draft" ? "rascunho" : item.status === "published" ? "publicado" : "revisao"}`}
                  >
                    {prototypeStatusLabels[item.status]}
                  </span>
                </td>
                <td className="date-cell">{formatDate(item.created_at)}</td>
                <td>
                  <code className="prototype-slug">/p/{item.slug}</code>
                  <small>Publicação por snapshot aprovado</small>
                </td>
                <td>
                  {publication?.(item.id)}
                  {rendererRegistry[`${item.niche}:${item.variant}`]
                    ?.renderer &&
                    personalization.success && (
                      <Link
                        href={`/prototipos/${item.id}/preview`}
                        className="button"
                      >
                        Ver site
                      </Link>
                    )}
                  <button
                    className="icon-button"
                    onClick={() => onInspect(item)}
                    aria-label={`Conferir dados e editar ${name}`}
                    title="Conferir dados e editar"
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!items.length && (
        <div className="empty-state">
          <Layers3 size={30} />
          <h3>Nenhum protótipo encontrado</h3>
          <p>Gere rascunhos a partir dos leads ou ajuste os filtros.</p>
        </div>
      )}
    </div>
  );
}
