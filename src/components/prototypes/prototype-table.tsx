import { Eye, Pencil, Send, ArrowUpRight, Layers3 } from "lucide-react";
import { demoLeads } from "@/data/demo";
import { niches, templates } from "@/config/catalog";
import { formatDate } from "@/lib/prototypes";
import { StatusBadge } from "@/components/ui";
import type { Prototype } from "@/types/domain";
export function PrototypeTable({
  items,
  compact = false,
}: {
  items: readonly Prototype[];
  compact?: boolean;
}) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Nicho / template</th>
            <th>Status</th>
            <th>Criado em</th>
            {!compact && <th>URL pública</th>}
            <th>
              <span className="sr-only">Ações futuras</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const lead = demoLeads.find((l) => l.id === item.leadId)!;
            const template = templates.find((t) => t.id === item.templateId)!;
            return (
              <tr key={item.id}>
                <td>
                  <div className="company-cell">
                    <span className={`company-icon niche-${lead.nicho}`}>
                      {lead.nome_empresa
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                    <div>
                      <strong>{lead.nome_empresa}</strong>
                      <small>
                        {lead.especialidade?.name ??
                          `${lead.cidade}, ${lead.estado}`}
                      </small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong className="table-niche">
                    {niches.find((n) => n.id === lead.nicho)?.shortName}
                  </strong>
                  <small>
                    {template.name} · {template.variant}
                  </small>
                </td>
                <td>
                  <StatusBadge status={item.status} />
                </td>
                <td className="date-cell">{formatDate(item.createdAt)}</td>
                {!compact && (
                  <td>
                    <span className="muted">Indisponível na demonstração</span>
                  </td>
                )}
                <td>
                  {compact ? (
                    <button
                      className="icon-button"
                      disabled
                      title="Visualização disponível em fase futura"
                      aria-label={`Visualizar ${lead.nome_empresa} — em breve`}
                    >
                      <ArrowUpRight size={18} />
                    </button>
                  ) : (
                    <div className="table-actions">
                      {[
                        { icon: Eye, label: "Visualizar" },
                        { icon: Pencil, label: "Editar" },
                        { icon: Send, label: "Publicar" },
                      ].map(({ icon: Icon, label }) => (
                        <button
                          key={label}
                          className="icon-button"
                          disabled
                          title={`${label}: em breve`}
                          aria-label={`${label} ${lead.nome_empresa} — em breve`}
                        >
                          <Icon size={16} />
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="empty-state">
          <Layers3 size={32} />
          <h3>Nenhum protótipo encontrado</h3>
          <p>
            Tente outro termo ou limpe os filtros para ver todos os exemplos.
          </p>
        </div>
      )}
    </div>
  );
}
