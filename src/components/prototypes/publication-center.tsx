"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { niches } from "@/config/catalog";
import {
  listPublications,
  sharingPublications,
} from "@/app/(admin)/publicacoes/actions";
import {
  reviewPublication,
  publishPrototype,
  unpublishPrototype,
} from "@/app/(admin)/prototipos/publication-actions";
import { PublicationPanel } from "./publication-panel";
import {
  linksCsv,
  updateSelection,
  processPublicationItems,
  type CenterFilters,
  type PublicationItem,
  type ItemOutcome,
  type SharedPublication,
} from "@/lib/publication-center";
import type { TemplateRow } from "@/types/database";
type ReviewResult = Awaited<ReturnType<typeof reviewPublication>>;
type ReviewItem = { item: PublicationItem; result: ReviewResult };
const stateLabels = {
  never: "Nunca publicado",
  published: "Publicado",
  unpublished: "Despublicado",
};
const date = (value: string | null) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";
export function PublicationCenter({
  initial,
  templates,
  initialFilters,
  invalidSelection,
}: {
  initial: Awaited<ReturnType<typeof listPublications>>;
  templates: TemplateRow[];
  initialFilters: CenterFilters;
  invalidSelection: boolean;
}) {
  const [page, setPage] = useState(initial.ok ? initial.data : null);
  const [base, setBase] = useState(initial.ok ? initial.base : null);
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [selection, setSelection] = useState<PublicationItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [outcomes, setOutcomes] = useState<ItemOutcome[]>([]);
  const [executionTotal, setExecutionTotal] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initial.ok ? "" : initial.error);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const lock = useRef(false);
  useEffect(() => {
    if (reviewOpen && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [reviewOpen]);
  const blocked = reviews.filter((r) => !r.result.ok).length;
  const eligible = reviews.filter((r) => r.result.ok);
  const reviewedSelection =
    reviews.length === selection.length &&
    reviews.every((r) => selection.some((s) => s.id === r.item.id));
  function download(rows: SharedPublication[], filename: string) {
    const url = URL.createObjectURL(
      new Blob([linksCsv(rows)], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  async function exportResults() {
    if (lock.current || !outcomes.length) return;
    lock.current = true;
    setBusy(true);
    try {
      const active = await sharingPublications(reviews.map((r) => r.item.id));
      if (!active.ok) {
        setMessage(active.error);
        return;
      }
      const rows: SharedPublication[] = reviews.map((r) => {
        const outcome = outcomes.find((o) => o.id === r.item.id);
        const shared = active.rows.find(
          (a) => a.url === `${base}/p/${r.item.slug}`,
        );
        if (outcome?.ok && shared) return shared;
        return {
          company: r.result.ok
            ? r.result.data.snapshot.confirmed.name
            : r.item.name,
          niche:
            niches.find((n) => n.id === r.item.niche)?.name ?? r.item.niche,
          template: `${r.item.template_name} · ${r.item.variant}`,
          status: !r.result.ok
            ? "Bloqueado"
            : outcome?.ok
              ? "Sem publicação ativa"
              : outcome
                ? "Falha"
                : "Pendente",
          url: "",
          publishedAt: "",
        };
      });
      download(rows, "loung-resultados-publicacao.csv");
      setMessage(`${rows.length} resultado(s) exportado(s).`);
    } catch {
      setMessage("Não foi possível exportar os resultados.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function load(next = applied) {
    const result = await listPublications(next);
    if (result.ok) {
      setPage(result.data);
      setBase(result.base);
      setApplied(next);
      setFilters(next);
    } else setMessage(result.error);
  }
  async function search(next: CenterFilters) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await load(next);
    } catch {
      setMessage("Consulta indisponível. Tente novamente.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function select(items: PublicationItem[], checked: boolean) {
    try {
      setSelection(updateSelection(selection, items, checked));
      setReviews([]);
      setOutcomes([]);
      setApproved(false);
    } catch {
      setMessage(
        "Limite de 25 selecionados. Desmarque itens antes de adicionar outros.",
      );
    }
  }
  async function reviewItems(items = selection) {
    if (lock.current || !items.length) return;
    lock.current = true;
    setBusy(true);
    setReviews([]);
    setOutcomes([]);
    setExecutionTotal(0);
    setReviewCount(items.length);
    setApproved(false);
    setReviewOpen(true);
    setMessage("");
    const collected: ReviewItem[] = [];
    try {
      await processPublicationItems(
        items,
        async (item) => {
          let result: ReviewResult;
          try {
            result = await reviewPublication(item.id);
          } catch {
            result = {
              ok: false,
              error: "Revisão não confirmada. Tente novamente.",
            };
          }
          collected.push({ item, result });
          setReviews([...collected]);
          return { ok: result.ok };
        },
        () => {},
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function publishReviewed() {
    if (lock.current || !approved || !eligible.length) return;
    lock.current = true;
    setBusy(true);
    setExecutionTotal(eligible.length);
    setOutcomes([]);
    try {
      const inputs = eligible.flatMap((r) =>
        r.result.ok ? [{ id: r.item.id, review: r.result.data }] : [],
      );
      await processPublicationItems(
        inputs,
        (item) =>
          publishPrototype({
            id: item.id,
            revision: item.review.revision,
            version: item.review.publication?.publication_version ?? 0,
            snapshot: item.review.snapshot,
            approved: true,
          }),
        setOutcomes,
      );
      setApproved(false);
      await load();
    } catch {
      setMessage(
        "Resultados recebidos preservados. Não foi possível atualizar a lista; consulte o estado atual antes de tentar novamente.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function share(ids: string[], csv: boolean) {
    if (!ids.length || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await sharingPublications(ids);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      if (!result.rows.length) {
        setMessage("Nenhuma publicação ativa entre os itens selecionados.");
        return;
      }
      if (csv) {
        const url = URL.createObjectURL(
          new Blob([linksCsv(result.rows)], { type: "text/csv;charset=utf-8" }),
        );
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "loung-links-publicados.csv";
        anchor.click();
        URL.revokeObjectURL(url);
      } else
        await navigator.clipboard.writeText(
          result.rows.map((row) => `${row.company} — ${row.url}`).join("\n"),
        );
      setMessage(
        `${result.rows.length} link(s) ${csv ? "exportado(s)" : "copiado(s)"}.${result.omitted ? ` ${result.omitted} item(ns) sem publicação ativa omitido(s).` : ""}`,
      );
    } catch {
      setMessage(
        "Não foi possível copiar ou exportar. Verifique as permissões do navegador e tente novamente.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function remove(item: PublicationItem) {
    if (
      lock.current ||
      !item.publication_version ||
      !window.confirm(
        `Despublicar ${item.name}? O site sairá do acesso público.`,
      )
    )
      return;
    lock.current = true;
    setBusy(true);
    try {
      const result = await unpublishPrototype(
        item.id,
        item.publication_version,
      );
      setMessage(result.ok ? `${item.name}: site despublicado.` : result.error);
      await load();
    } catch {
      setMessage(
        "Resultado não confirmado. Atualize a lista antes de tentar novamente.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const successIds = outcomes.filter((r) => r.ok).map((r) => r.id);
  const failureIds = outcomes.filter((r) => !r.ok).map((r) => r.id);
  const visible = page?.items ?? [];
  const allPageSelected =
    visible.length > 0 &&
    visible.every((item) => selection.some((s) => s.id === item.id));
  return (
    <div className="publication-center">
      <header className="page-heading">
        <div>
          <p className="eyebrow">DO RASCUNHO AO COMPARTILHAMENTO</p>
          <h1>Central de Publicação</h1>
          <p>Revise, publique e compartilhe seus protótipos em um só lugar.</p>
        </div>
      </header>
      {invalidSelection && (
        <p role="alert">
          Seleção recebida inválida ou acima de 25 itens. Nenhum item foi
          selecionado.
        </p>
      )}
      {!base && (
        <p className="import-notice">
          URL pública indisponível. Configure STUDIO_PUBLIC_URL para copiar e
          abrir links.
        </p>
      )}
      {page && (
        <div className="publication-metrics">
          {Object.entries({
            total: "Total de protótipos",
            never: "Nunca publicados",
            published: "Publicados",
            pending: "Alterações pendentes",
            unpublished: "Despublicados",
          }).map(([key, label]) => (
            <div key={key}>
              <strong>{page.metrics[key as keyof typeof page.metrics]}</strong>
              <span>{label}</span>
            </div>
          ))}
          <div>
            <strong>{blocked}</strong>
            <span>Bloqueados nesta revisão</span>
          </div>
        </div>
      )}
      <p className="form-hint">
        Indicadores consultados no banco. Bloqueios representam somente a
        revisão desta sessão; a base inteira não foi validada.
      </p>
      <section className="panel">
        <form
          className="publication-filters"
          onSubmit={(e) => {
            e.preventDefault();
            void search({ ...filters, page: 0 });
          }}
        >
          <label>
            Empresa
            <input
              value={filters.query}
              maxLength={100}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
              placeholder="Buscar por nome"
            />
          </label>
          <label>
            Nicho
            <select
              value={filters.niche}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  niche: e.target.value as CenterFilters["niche"],
                })
              }
            >
              <option value="">Todos</option>
              {niches.map((n) => (
                <option value={n.id} key={n.id}>
                  {n.shortName}
                </option>
              ))}
            </select>
          </label>
          <label>
            Template
            <select
              value={filters.template}
              onChange={(e) =>
                setFilters({ ...filters, template: e.target.value })
              }
            >
              <option value="">Todos</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.variant}
                </option>
              ))}
            </select>
          </label>
          <label>
            Publicação
            <select
              value={filters.state}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  state: e.target.value as CenterFilters["state"],
                })
              }
            >
              <option value="">Todas</option>
              {Object.entries(stateLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Alterações
            <select
              value={filters.pending}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  pending: e.target.value as CenterFilters["pending"],
                })
              }
            >
              <option value="">Todas</option>
              <option value="yes">Pendentes</option>
              <option value="no">Sem alterações pendentes</option>
            </select>
          </label>
          <label>
            Ordenar
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  sort: e.target.value as CenterFilters["sort"],
                })
              }
            >
              <option value="updated">Atualização recente</option>
              <option value="name">Empresa A–Z</option>
              <option value="published">Publicação recente</option>
            </select>
          </label>
          <button className="button" disabled={busy}>
            Aplicar filtros
          </button>
          {filters.ids && (
            <button
              type="button"
              className="button"
              disabled={busy}
              onClick={() => {
                const { ids: _ids, ...all } = filters;
                void _ids;
                void search({ ...all, page: 0 });
              }}
            >
              Mostrar todos os protótipos
            </button>
          )}
        </form>
        {filters.ids && (
          <p>
            Exibindo o grupo recém-gerado ({filters.ids.length}{" "}
            identificadores). Selecione os itens que deseja revisar.
          </p>
        )}
        <div className="publication-toolbar">
          <strong>{selection.length} selecionado(s) · limite 25</strong>
          <button
            className="button"
            disabled={busy || !visible.length}
            onClick={() => select(visible, !allPageSelected)}
          >
            {allPageSelected ? "Desmarcar esta página" : "Selecionar esta página"}
          </button>
          <button
            className="button"
            disabled={busy || !selection.length}
            onClick={() => void reviewItems()}
          >
            Revisar selecionados
          </button>
          <button
            className="button primary"
            disabled={busy || !eligible.length || !reviewedSelection}
            onClick={() => {
              setApproved(false);
              setReviewOpen(true);
            }}
          >
            Publicar selecionados
          </button>
          <button
            className="button"
            disabled={busy || !selection.length || !base}
            onClick={() =>
              void share(
                selection.map((i) => i.id),
                false,
              )
            }
          >
            Copiar links
          </button>
          <button
            className="button"
            disabled={busy || !selection.length || !base}
            onClick={() =>
              void share(
                selection.map((i) => i.id),
                true,
              )
            }
          >
            Exportar links CSV
          </button>
          <button
            className="button"
            disabled={busy || !selection.length}
            onClick={() => {
              setSelection([]);
              setReviews([]);
              setOutcomes([]);
            }}
          >
            Desmarcar todos
          </button>
        </div>
        {!!selection.length && (
          <details className="publication-selected">
            <summary>
              Seleção mantida entre páginas e filtros — conferir todos os nomes
            </summary>
            <ul>
              {selection.map((item) => (
                <li key={item.id}>
                  {item.name}{" "}
                  <button
                    className="text-link"
                    disabled={busy}
                    onClick={() => select([item], false)}
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
        {message && (
          <p role="status" className="import-notice">
            {message}
          </p>
        )}
        {busy && (
          <p role="status">
            Processando respostas reais. Não há execução em segundo plano;
            mantenha esta página aberta.
          </p>
        )}
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Tabela de publicação com rolagem horizontal"
        >
          <table className="publication-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Selecionar somente itens desta página"
                    checked={allPageSelected}
                    disabled={busy || !visible.length}
                    onChange={(e) => select(visible, e.target.checked)}
                  />
                </th>
                <th>Empresa</th>
                <th>Nicho / template</th>
                <th>Publicação / revisão</th>
                <th>Atualização / publicação</th>
                <th>Link / ações</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const reviewed = reviews.find((r) => r.item.id === item.id);
                const url =
                  base && item.state === "published"
                    ? `${base}/p/${item.slug}`
                    : null;
                return (
                  <tr key={item.id}>
                    <td>
                      <input
                        aria-label={`Selecionar ${item.name}`}
                        type="checkbox"
                        disabled={busy}
                        checked={selection.some((s) => s.id === item.id)}
                        onChange={(e) => select([item], e.target.checked)}
                      />
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                      <small>Rascunho v{item.revision}</small>
                    </td>
                    <td>
                      {niches.find((n) => n.id === item.niche)?.shortName}
                      <small>
                        {item.template_name} · {item.variant}
                      </small>
                    </td>
                    <td>
                      {stateLabels[item.state]}
                      <small>
                        {item.pending
                          ? "Alterações não publicadas"
                          : "Sem alterações pendentes"}
                      </small>
                      <small>
                        {reviewed
                          ? reviewed.result.ok
                            ? reviewed.result.data.revision !== item.revision
                              ? "Revisão desatualizada"
                              : reviewed.result.data.warnings.length > 2
                                ? "Atenção"
                                : "Apto"
                            : "Bloqueado"
                          : "Não validado nesta sessão"}
                        {item.publication_version
                          ? ` · publicação v${item.publication_version}`
                          : ""}
                      </small>
                    </td>
                    <td>
                      {date(item.updated_at)}
                      <small>Publicado: {date(item.published_at)}</small>
                    </td>
                    <td>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link"
                        >
                          Abrir site ↗
                        </a>
                      ) : (
                        <small>
                          {item.state === "published"
                            ? "Configure a URL pública"
                            : "Sem link ativo"}
                        </small>
                      )}
                      <details>
                        <summary>Ações do protótipo</summary>
                        <div className="publication-row-actions">
                          <Link
                            href={`/prototipos/${item.id}/preview`}
                            className="text-link"
                          >
                            Visualizar
                          </Link>
                          <Link
                            href={`/prototipos?edit=${item.id}`}
                            className="text-link"
                          >
                            Editar
                          </Link>
                          <button
                            className="text-link"
                            disabled={busy}
                            onClick={() => void reviewItems([item])}
                          >
                            {item.state === "published"
                              ? "Republicar"
                              : "Publicar"}
                          </button>
                          {item.state === "published" && (
                            <>
                              <button
                                className="text-link"
                                disabled={busy || !base}
                                onClick={() => void share([item.id], false)}
                              >
                                Copiar link
                              </button>
                              <button
                                className="text-link"
                                disabled={busy}
                                onClick={() => void remove(item)}
                              >
                                Despublicar
                              </button>
                            </>
                          )}
                        </div>
                        <PublicationPanel
                          id={item.id}
                          onChanged={() => void search(applied)}
                        />
                      </details>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <p className="empty-state">
            {page?.metrics.total
              ? "Nenhum resultado para os filtros. Ajuste a busca."
              : "Nenhum protótipo disponível. Gere rascunhos em Protótipos para começar."}
          </p>
        )}
        <div className="publication-toolbar">
          <span>
            {page?.total ?? 0} resultado(s) · página {applied.page + 1}
          </span>
          <button
            className="button"
            disabled={busy || applied.page === 0}
            onClick={() => void search({ ...applied, page: applied.page - 1 })}
          >
            Anterior
          </button>
          <button
            className="button"
            disabled={busy || !page || (applied.page + 1) * 25 >= page.total}
            onClick={() => void search({ ...applied, page: applied.page + 1 })}
          >
            Próxima
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => void search(applied)}
          >
            Atualizar lista
          </button>
        </div>
      </section>
      {!!outcomes.length && (
        <section className="panel" aria-live="polite">
          <h2>Resultados da publicação</h2>
          <p>
            {outcomes.length} de {executionTotal} concluído(s) ·{" "}
            {successIds.length} publicado(s) · {failureIds.length} falha(s) ·{" "}
            {Math.max(0, executionTotal - outcomes.length)} pendente(s) ·{" "}
            {blocked} bloqueado(s) não enviado(s).
          </p>
          <ul>
            {outcomes.map((r) => (
              <li key={r.id}>
                {reviews.find((x) => x.item.id === r.id)?.item.name}:{" "}
                {r.ok ? "Publicação confirmada" : r.error}
              </li>
            ))}
          </ul>
          <div className="publication-toolbar">
            <button
              className="button"
              disabled={busy || !successIds.length}
              onClick={() => void share(successIds, false)}
            >
              Copiar links dos publicados
            </button>
            <button
              className="button"
              disabled={busy || !successIds.length}
              onClick={() => void share(successIds, true)}
            >
              Exportar publicados CSV
            </button>
            <button
              className="button"
              disabled={busy || !base}
              onClick={() => void exportResults()}
            >
              Exportar todos os resultados CSV
            </button>
            <button
              className="button"
              disabled={busy || !failureIds.length}
              onClick={() =>
                void reviewItems(
                  reviews
                    .filter((r) => failureIds.includes(r.item.id))
                    .map((r) => r.item),
                )
              }
            >
              Revisar falhas e tentar novamente
            </button>
          </div>
        </section>
      )}
      {reviewOpen && (
        <dialog
          ref={dialog}
          className="publication-dialog"
          aria-labelledby="batch-publication-title"
          onCancel={(e) => {
            if (busy) e.preventDefault();
            else setReviewOpen(false);
          }}
        >
          <h2 id="batch-publication-title">Revisão do lote</h2>
          <p>
            Confirme somente após conferir os dados públicos de cada item. A
            autorização abrange textos, serviços, contatos, profissionais,
            catálogos e direitos de uso das imagens. Imagens ilustrativas e
            informações conceituais devem permanecer identificadas.
          </p>
          <p>
            {reviews.length} de {reviewCount} revisado(s) · {eligible.length}{" "}
            apto(s), incluindo avisos · {blocked} bloqueado(s).
          </p>
          {busy && (
            <p role="status">
              {executionTotal
                ? `${outcomes.length} de ${executionTotal} publicações respondidas.`
                : "Revisando os selecionados…"}
            </p>
          )}
          {reviews.map((r) => (
            <section key={r.item.id} className="publication-review-item">
              <h3>
                {r.result.ok
                  ? r.result.data.snapshot.confirmed.name
                  : r.item.name}{" "}
                · {r.item.template_name}
              </h3>
              {r.result.ok ? (
                <>
                  <strong>
                    {r.result.data.warnings.length > 2 ? "ATENÇÃO" : "APTO"} ·
                    rascunho v{r.result.data.revision}
                  </strong>
                  <details>
                    <summary>
                      {Math.max(0, r.result.data.warnings.length - 2)} aviso(s)
                      não impeditivo(s)
                    </summary>
                    {r.result.data.warnings.slice(2).map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                  </details>
                  <details>
                    <summary>Conferir dados públicos aprováveis</summary>
                    <pre>{JSON.stringify(r.result.data.snapshot, null, 2)}</pre>
                  </details>
                </>
              ) : (
                <p role="alert">BLOQUEADO: {r.result.error}</p>
              )}
              <Link
                className="text-link"
                href={`/prototipos?edit=${r.item.id}`}
              >
                Corrigir no editor
              </Link>{" "}
              ·{" "}
              <Link
                className="text-link"
                href={`/prototipos/${r.item.id}/preview`}
                target="_blank"
              >
                Abrir prévia autenticada
              </Link>
            </section>
          ))}
          {!eligible.length && !busy && (
            <p>
              Todos os itens estão bloqueados. Corrija os dados e faça nova
              revisão.
            </p>
          )}
          <label>
            <input
              type="checkbox"
              checked={approved}
              disabled={busy || !!outcomes.length || !eligible.length}
              onChange={(e) => setApproved(e.target.checked)}
            />{" "}
            Revisei os dados de todos os {eligible.length} itens aptos,
            inclusive os avisos. Autorizo publicar seus textos, imagens,
            catálogos e contatos. Os {blocked} bloqueados não serão publicados.
          </label>
          <div className="publication-toolbar">
            <button
              className="button"
              disabled={busy}
              onClick={() => setReviewOpen(false)}
            >
              Fechar revisão
            </button>
            <button
              className="button primary"
              disabled={
                busy || !approved || !eligible.length || !!outcomes.length
              }
              onClick={() => void publishReviewed()}
            >
              Confirmar publicação de {eligible.length} item(ns)
            </button>
          </div>
          {!!outcomes.length && (
            <p role="status">
              {successIds.length} publicado(s), {failureIds.length} falha(s),{" "}
              {blocked} bloqueado(s). Feche a revisão para consultar resultados
              e compartilhar links.
            </p>
          )}
        </dialog>
      )}
    </div>
  );
}
