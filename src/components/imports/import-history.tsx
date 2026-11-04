import type { ImportRow } from "@/types/database";
import { formatDate } from "@/lib/prototypes";
const statusLabels: Record<ImportRow["status"], string> = {
  pending: "Pendente",
  processing: "Processando",
  completed: "Concluída",
  partial: "Parcial",
  failed: "Falhou",
};
export function ImportHistory({ items }: { items: ImportRow[] }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>Histórico de importações</h2>
          <p>
            Últimas 100 operações. Importados = inseridos + atualizados; não
            gravados incluem linhas ignoradas e inválidas.
          </p>
        </div>
        <span className="count">{items.length}</span>
      </div>
      {items.length ? (
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Histórico de importações com rolagem horizontal"
        >
          <table>
            <thead>
              <tr>
                <th>Arquivo / data</th>
                <th>Status</th>
                <th>Linhas</th>
                <th>Inseridos</th>
                <th>Atualizados</th>
                <th>Não gravados</th>
                <th>Duplicatas</th>
                <th>Erro</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td>
                    <strong>{i.filename}</strong>
                    <small>{formatDate(i.created_at)}</small>
                  </td>
                  <td>
                    <span
                      className={`badge ${i.status === "completed" ? "status-publicado" : "status-revisao"}`}
                    >
                      {statusLabels[i.status]}
                    </span>
                  </td>
                  <td>{i.total_rows}</td>
                  <td>{i.inserted_rows}</td>
                  <td>{i.updated_rows}</td>
                  <td>{i.invalid_rows}</td>
                  <td>{i.duplicate_rows}</td>
                  <td>
                    {i.error_code === "23505" || i.error_code === "40001"
                      ? "Revisar correspondências"
                      : i.error_code
                        ? "Transação não concluída"
                        : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h3>Nenhuma importação realizada</h3>
          <p>Os lotes confirmados aparecerão aqui.</p>
        </div>
      )}
    </section>
  );
}
