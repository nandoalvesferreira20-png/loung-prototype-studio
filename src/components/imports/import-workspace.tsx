"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpFromLine,
  Check,
  FileSpreadsheet,
  FileUp,
  Search,
} from "lucide-react";
import {
  previewImportAction,
  commitImportAction,
} from "@/app/(admin)/importacoes/actions";
import { niches } from "@/config/catalog";
import { autoMap, mapRow, type Mapping } from "@/lib/imports/mapping";
import { checkFile, type ParsedSheet } from "@/lib/imports/read-file";
import {
  fields,
  fieldLabels,
  findFileDuplicates,
  IMPORT_LIMITS,
  normalize,
  rowErrors,
  type DraftLead,
  type Decision,
  type DuplicatePreview,
  type ImportRequest,
  type ImportSummary,
} from "@/lib/imports/model";
type ReviewRow = {
  row: number;
  lead: DraftLead;
  review: boolean;
  ignored: boolean;
  decision: Decision;
  reason: string;
  targetId: string | null;
  targetUpdatedAt: string | null;
};
function createRows(sheet: ParsedSheet, mapping: Mapping): ReviewRow[] {
  const result: ReviewRow[] = sheet.rows.map((r) => {
    const mapped = mapRow(r.cells, mapping);
    return {
      row: r.row,
      ...mapped,
      ignored: false,
      decision: "insert",
      reason: "",
      targetId: null,
      targetUpdatedAt: null,
    };
  });
  const duplicates = findFileDuplicates(result);
  return result.map((r) =>
    duplicates.has(r.row) ? { ...r, decision: "skip" } : r,
  );
}
export function ImportWorkspace() {
  const input = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const router = useRouter();
  const [filename, setFilename] = useState("");
  const [sheet, setSheet] = useState<ParsedSheet | null>(null);
  const [mapping, setMapping] = useState<Mapping>({});
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [matches, setMatches] = useState<DuplicatePreview[] | null>(null);
  const [requestId, setRequestId] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [drag, setDrag] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  useEffect(() => () => worker.current?.terminate(), []);
  function invalidate() {
    setMatches(null);
    setSummary(null);
    setError("");
    setRequestId(crypto.randomUUID());
  }
  async function select(file?: File) {
    if (!file || busy) return;
    worker.current?.terminate();
    setError("");
    setSummary(null);
    setSheet(null);
    setRows([]);
    setMatches(null);
    setFilename("");
    setPage(0);
    try {
      checkFile(file.name, file.size);
      setBusy("Lendo planilha…");
      const bytes = await file.arrayBuffer();
      const parsed = await new Promise<ParsedSheet>((resolve, reject) => {
        const active = new Worker(
          new URL("../../lib/imports/parse.worker.ts", import.meta.url),
        );
        worker.current = active;
        const timer = setTimeout(() => {
          active.terminate();
          reject(
            new Error(
              "A leitura excedeu o tempo limite. Reduza o arquivo e tente novamente.",
            ),
          );
        }, IMPORT_LIMITS.timeoutMs);
        active.onmessage = (
          event: MessageEvent<{
            ok: boolean;
            sheet: ParsedSheet;
            message: string;
          }>,
        ) => {
          clearTimeout(timer);
          active.terminate();
          if (event.data.ok) resolve(event.data.sheet);
          else reject(new Error(event.data.message));
        };
        active.onerror = () => {
          clearTimeout(timer);
          active.terminate();
          reject(
            new Error(
              "Não foi possível ler o arquivo. Verifique se é um CSV ou XLSX válido.",
            ),
          );
        };
        active.postMessage({ name: file.name, bytes }, [bytes]);
      });
      const detected = autoMap(
        parsed.headers,
        parsed.rows.map((r) => r.cells),
      );
      setFilename(file.name);
      setSheet(parsed);
      setMapping(detected);
      setRows(createRows(parsed, detected));
      setRequestId(crypto.randomUUID());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ler a planilha.",
      );
    } finally {
      setBusy("");
      if (input.current) input.current.value = "";
    }
  }
  function edit(row: number, update: Partial<ReviewRow>) {
    invalidate();
    setRows((current) =>
      current.map((r) => (r.row === row ? { ...r, ...update } : r)),
    );
  }
  const reviewed = useMemo(() => {
    const fileDuplicates = findFileDuplicates(rows);
    return rows.map((r) => {
      const duplicateOf = fileDuplicates.get(r.row);
      const errors = rowErrors(r.lead);
      const dbMatches = matches?.find((m) => m.row === r.row)?.matches ?? [];
      return {
        ...r,
        errors,
        duplicateOf,
        dbMatches,
        duplicate: duplicateOf !== undefined || dbMatches.length > 0,
      };
    });
  }, [rows, matches]);
  const valid = reviewed.filter(
    (r) => !r.ignored && !r.review && r.errors.length === 0,
  );
  const saving = valid.filter((r) => r.decision !== "skip");
  const invalid = reviewed.filter(
    (r) => r.errors.length > 0 && !r.ignored,
  ).length;
  const needsReview = reviewed.filter((r) => r.review && !r.ignored).length;
  const duplicates = reviewed.filter((r) => r.duplicate).length;
  const visible = reviewed.filter(
    (r) =>
      normalize(
        [r.lead.name, r.lead.city, r.lead.google_category].join(" "),
      ).includes(normalize(query)) &&
      (filter === "all" ||
        (filter === "invalid" && r.errors.length > 0) ||
        (filter === "review" && r.review) ||
        (filter === "duplicate" && r.duplicate) ||
        (filter === "included" && !r.ignored)),
  );
  const pages = Math.max(1, Math.ceil(visible.length / 20));
  const currentPage = Math.min(page, pages - 1);
  function request(): ImportRequest {
    return {
      requestId,
      filename,
      totalRows: rows.length,
      rows: valid.map((r) => ({
        row: r.row,
        lead: r.lead as ImportRequest["rows"][number]["lead"],
        decision: r.decision,
        reason: r.reason,
        targetId: r.targetId,
        targetUpdatedAt: r.targetUpdatedAt,
      })),
    };
  }
  async function perform(operation: "preview" | "commit") {
    setError("");
    setBusy(
      operation === "preview"
        ? "Conferindo duplicatas no banco…"
        : "Salvando lote…",
    );
    try {
      const result = await (
        operation === "preview" ? previewImportAction : commitImportAction
      )(request());
      if (!result.ok) {
        setError(
          [
            result.message,
            ...(result.issues ?? [])
              .slice(0, 5)
              .map((i) => `Linha ${i.row}, ${i.field}: ${i.message}`),
          ].join(" "),
        );
        return;
      }
      if (result.matches) {
        setMatches(result.matches);
        setRows((current) =>
          current.map((r) =>
            result.matches!.some(
              (m) => m.row === r.row && m.matches.length > 0,
            ) && r.decision === "insert"
              ? { ...r, decision: "skip" }
              : r,
          ),
        );
      }
      if (result.summary) {
        setSummary(result.summary);
        router.refresh();
      }
    } catch {
      setError(
        "Não foi possível confirmar o resultado. Tente novamente sem alterar o lote: a mesma solicitação não será gravada duas vezes.",
      );
    } finally {
      setBusy("");
    }
  }
  function decide(row: number, patch: Partial<ReviewRow>) {
    setError("");
    setSummary(null);
    setRequestId(crypto.randomUUID());
    setRows((current) =>
      current.map((r) => (r.row === row ? { ...r, ...patch } : r)),
    );
  }
  const decisionErrors = valid.some(
    (r) =>
      (r.decision === "separate" && r.reason.trim().length < 10) ||
      (r.decision === "update" && !r.targetId) ||
      (r.duplicate && r.decision === "insert"),
  );
  return (
    <>
      <div className="import-layout">
        <section className="panel upload-panel">
          <div className="section-heading">
            <div>
              <h2>Comece pela sua planilha</h2>
              <p>Organize suas oportunidades em um só lugar.</p>
            </div>
            <span className="step-number">01</span>
          </div>
          <div
            className={`dropzone ${drag ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void select(e.dataTransfer.files[0]);
            }}
          >
            <span className="upload-icon">
              <ArrowUpFromLine size={27} />
            </span>
            <h3>
              {filename
                ? "Planilha pronta para revisão"
                : "Arraste sua planilha até aqui"}
            </h3>
            <p>{filename || "ou escolha um arquivo no seu computador"}</p>
            <button
              disabled={!!busy}
              className="button primary"
              onClick={() => input.current?.click()}
            >
              <FileUp size={16} />
              {filename ? "Trocar arquivo" : "Selecionar arquivo"}
            </button>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".csv,.xlsx"
              aria-label="Selecionar planilha CSV ou XLSX"
              onChange={(e) => void select(e.target.files?.[0])}
            />
            <small>
              CSV ou XLSX · até {IMPORT_LIMITS.maxBytes / 1024 / 1024} MB ·{" "}
              {IMPORT_LIMITS.maxRows} registros · leitura local
            </small>
          </div>
          {busy && (
            <p role="status" className="import-notice">
              {busy}
            </p>
          )}
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
          {sheet?.warnings.map((w) => (
            <p className="field-hint" key={w}>
              {w}
            </p>
          ))}
        </section>
        <aside className="panel import-guide">
          <p className="eyebrow">ANTES DE COMEÇAR</p>
          <h2>
            Uma boa base faz
            <br />
            toda a diferença.
          </h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Exporte seus leads</strong>
                <p>Use CSV ou XLSX do Loung Prospect, somente com valores.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Mapeie e revise</strong>
                <p>
                  Confira as colunas, os nichos e os possíveis registros
                  duplicados.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Salve os registros válidos</strong>
                <p>
                  A gravação exige acesso administrativo. Protótipos não são
                  gerados nesta etapa.
                </p>
              </div>
            </li>
          </ol>
          <div className="guide-rule">
            <Check size={18} />
            <span>
              Você revisa antes de salvar.
              <br />
              <small>O arquivo permanece no seu navegador.</small>
            </span>
          </div>
        </aside>
      </div>
      {sheet && (
        <section className="panel import-mapping">
          <div className="section-heading">
            <div>
              <h2>Mapeamento de colunas</h2>
              <p>
                Associe cada campo à coluna da planilha. Alterar o mapeamento
                refaz a prévia e descarta as edições locais.
              </p>
            </div>
            <span className="step-number">02</span>
          </div>
          <fieldset
            disabled={!!busy || !!summary}
            className="import-field-grid"
          >
            {fields.map((field) => (
              <label key={field}>
                {fieldLabels[field]}
                <select
                  value={mapping[field] ?? ""}
                  onChange={(e) => {
                    const next = {
                      ...mapping,
                      [field]:
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                    };
                    invalidate();
                    setMapping(next);
                    setRows(createRows(sheet, next));
                    setPage(0);
                  }}
                >
                  <option value="">Não mapear</option>
                  {sheet.headers.map((h, i) => (
                    <option key={i} value={i}>
                      {i + 1}. {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
          <p className="field-hint">
            Separador:{" "}
            {sheet.delimiter === "\t"
              ? "tabulação"
              : sheet.delimiter || "XLSX, primeira aba"}
            . URLs de redes sociais e Google Maps não devem ser mapeadas como
            site.
          </p>
        </section>
      )}
      <section className="panel preview-panel">
        <div className="section-heading">
          <div>
            <h2>Pré-visualização dos registros</h2>
            <p>
              Corrija os dados, confirme as classificações e escolha quais
              registros gravar.
            </p>
          </div>
          <span className="step-number">03</span>
        </div>
        <div className="preview-counts">
          <span>
            Total <strong>{rows.length}</strong>
          </span>
          <span>
            <i className="valid-dot" /> Válidos <strong>{valid.length}</strong>
          </span>
          <span>
            <i className="invalid-dot" /> Inválidos <strong>{invalid}</strong>
          </span>
          <span>
            Revisar <strong>{needsReview}</strong>
          </span>
          <span>
            Duplicatas <strong>{duplicates}</strong>
          </span>
        </div>
        {rows.length ? (
          <>
            <div className="import-distribution">
              {niches.map((n) => (
                <span key={n.id}>
                  {n.shortName}:{" "}
                  <b>
                    {
                      reviewed.filter(
                        (r) => r.lead.niche === n.id && !r.ignored,
                      ).length
                    }
                  </b>
                </span>
              ))}
            </div>
            <div className="filter-bar">
              <label className="search-input">
                <Search size={16} />
                <input
                  aria-label="Buscar registros da prévia"
                  placeholder="Buscar empresa, cidade ou categoria"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <select
                aria-label="Filtrar registros"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="all">Todos</option>
                <option value="invalid">Inválidos</option>
                <option value="review">Precisam de revisão</option>
                <option value="duplicate">Possíveis duplicatas</option>
                <option value="included">Não ignorados</option>
              </select>
            </div>
            <fieldset disabled={!!busy || !!summary} className="import-review">
              <div
                className="table-scroll"
                tabIndex={0}
                role="region"
                aria-label="Revisão de leads com rolagem horizontal"
              >
                <table>
                  <thead>
                    <tr>
                      <th>Linha / incluir</th>
                      <th>Empresa</th>
                      <th>Nicho</th>
                      <th>Validação e revisão</th>
                      <th>Decisão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible
                      .slice(currentPage * 20, currentPage * 20 + 20)
                      .map((r) => (
                        <tr
                          key={r.row}
                          className={r.ignored ? "import-ignored" : undefined}
                        >
                          <td>
                            <label className="import-checkbox">
                              <input
                                type="checkbox"
                                checked={!r.ignored}
                                onChange={(e) =>
                                  edit(r.row, { ignored: !e.target.checked })
                                }
                              />{" "}
                              {r.row}
                            </label>
                          </td>
                          <td>
                            <input
                              className="import-input"
                              aria-label={`Nome, linha ${r.row}`}
                              value={r.lead.name}
                              onChange={(e) =>
                                edit(r.row, {
                                  lead: { ...r.lead, name: e.target.value },
                                })
                              }
                            />
                            <details>
                              <summary>Editar todos os campos</summary>
                              <div className="import-row-editor">
                                {fields
                                  .filter((f) => f !== "name" && f !== "niche")
                                  .map((f) => (
                                    <label key={f}>
                                      {fieldLabels[f]}
                                      <input
                                        className="import-input"
                                        value={r.lead[f]}
                                        aria-invalid={r.errors.some(
                                          (e) => e.field === f,
                                        )}
                                        onChange={(e) =>
                                          edit(r.row, {
                                            lead: {
                                              ...r.lead,
                                              [f]: e.target.value,
                                            },
                                          })
                                        }
                                      />
                                    </label>
                                  ))}
                              </div>
                            </details>
                          </td>
                          <td>
                            <select
                              aria-label={`Nicho, linha ${r.row}`}
                              value={r.lead.niche}
                              onChange={(e) =>
                                edit(r.row, {
                                  lead: {
                                    ...r.lead,
                                    niche: e.target.value as DraftLead["niche"],
                                    specialty:
                                      e.target.value === "clinicas"
                                        ? r.lead.specialty
                                        : "",
                                  },
                                  review: false,
                                })
                              }
                            >
                              <option value="">Revisão necessária</option>
                              {niches.map((n) => (
                                <option key={n.id} value={n.id}>
                                  {n.shortName}
                                </option>
                              ))}
                            </select>
                            <small>{r.lead.specialty}</small>
                          </td>
                          <td>
                            {r.errors.map((e) => (
                              <p
                                key={e.field + e.message}
                                className="import-row-error"
                              >
                                {fieldLabels[e.field as keyof DraftLead] ??
                                  e.field}
                                : {e.message}
                              </p>
                            ))}
                            {r.review && (
                              <label className="import-checkbox">
                                <input
                                  type="checkbox"
                                  checked={false}
                                  onChange={() =>
                                    edit(r.row, { review: false })
                                  }
                                />{" "}
                                Confirmar classificação
                              </label>
                            )}
                            {r.duplicateOf !== undefined && (
                              <p className="field-hint">
                                Possível duplicata da linha {r.duplicateOf}.
                              </p>
                            )}
                            {r.dbMatches.length > 0 && (
                              <details>
                                <summary>
                                  {r.dbMatches.length} correspondência(s) no
                                  banco
                                </summary>
                                {r.dbMatches.map((m) => (
                                  <p className="field-hint" key={m.id}>
                                    {m.name} · {m.address || "Sem endereço"} ·{" "}
                                    {m.phone || "Sem telefone"}
                                  </p>
                                ))}
                              </details>
                            )}
                            {!r.review && !r.errors.length && (
                              <span className="badge status-publicado">
                                Válido
                              </span>
                            )}
                          </td>
                          <td>
                            <select
                              aria-label={`Decisão, linha ${r.row}`}
                              value={r.decision}
                              onChange={(e) =>
                                decide(r.row, {
                                  decision: e.target.value as Decision,
                                  targetId: null,
                                  targetUpdatedAt: null,
                                })
                              }
                            >
                              <option value="insert" disabled={r.duplicate}>
                                Inserir
                              </option>
                              <option value="skip">Ignorar</option>
                              {r.dbMatches.length > 0 && (
                                <option value="update">
                                  Atualizar existente
                                </option>
                              )}
                              <option value="separate">Manter separado</option>
                            </select>
                            {r.decision === "separate" && (
                              <label>
                                Justificativa
                                <input
                                  className="import-input"
                                  value={r.reason}
                                  placeholder="Por que é uma empresa diferente?"
                                  onChange={(e) =>
                                    decide(r.row, { reason: e.target.value })
                                  }
                                />
                              </label>
                            )}
                            {r.decision === "update" && (
                              <>
                                <select
                                  aria-label={`Registro a atualizar, linha ${r.row}`}
                                  value={r.targetId ?? ""}
                                  onChange={(e) => {
                                    const target = r.dbMatches.find(
                                      (m) => m.id === e.target.value,
                                    );
                                    decide(r.row, {
                                      targetId: target?.id ?? null,
                                      targetUpdatedAt:
                                        target?.updated_at ?? null,
                                    });
                                  }}
                                >
                                  <option value="">Selecione o registro</option>
                                  {r.dbMatches.map((m) => (
                                    <option key={m.id} value={m.id}>
                                      {m.name} · {m.address || m.phone || m.id}
                                    </option>
                                  ))}
                                </select>
                                <p className="field-hint">
                                  Substitui os campos pelo conteúdo revisado,
                                  inclusive campos vazios. O registro será
                                  conferido novamente ao salvar.
                                </p>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!visible.length && (
                  <p className="import-notice">
                    Nenhum registro corresponde ao filtro.
                  </p>
                )}
              </div>
            </fieldset>
            <div className="import-actions">
              <button
                className="button"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Anterior
              </button>
              <span>
                Página {currentPage + 1} de {pages}
              </span>
              <button
                className="button"
                disabled={currentPage + 1 >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Próxima
              </button>
            </div>
            <div className="import-actions">
              <p>
                {saving.length} registro(s) para gravar ·{" "}
                {rows.length - saving.length} não serão gravados.{" "}
                {matches === null
                  ? "Confira as duplicatas no banco antes de salvar."
                  : "Duplicatas conferidas; a transação verificará novamente."}
              </p>
              <button
                disabled={!!busy || !valid.length || !!summary}
                className="button"
                onClick={() => void perform("preview")}
              >
                Conferir duplicatas
              </button>
              <button
                disabled={
                  !!busy ||
                  matches === null ||
                  !saving.length ||
                  decisionErrors ||
                  !!summary
                }
                className="button primary"
                onClick={() => void perform("commit")}
              >
                Salvar {saving.length} registro(s)
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <FileSpreadsheet size={30} />
            <h3>Seus registros aparecerão aqui</h3>
            <p>Selecione uma planilha para mapear e revisar os leads.</p>
          </div>
        )}
        {summary && (
          <div className="import-result" role="status">
            <h3>
              {summary.status === "failed"
                ? "O lote não foi gravado"
                : "Importação concluída"}
            </h3>
            <p>
              Inseridos: {summary.inserted_rows} · Atualizados:{" "}
              {summary.updated_rows} · Não gravados: {summary.skipped_rows} ·
              Duplicatas identificadas: {summary.duplicate_rows}.
            </p>
            {summary.status === "failed" && (
              <>
                <p>
                  Nenhum lead deste lote foi salvo.{" "}
                  {summary.error_code === "23505" ||
                  summary.error_code === "40001"
                    ? "Uma correspondência mudou ou requer revisão. Confira novamente as duplicatas."
                    : "Verifique os dados e a configuração do banco antes de tentar novamente."}
                </p>
                <button className="button" onClick={invalidate}>
                  Revisar e iniciar nova tentativa
                </button>
              </>
            )}
            <small>Operação: {summary.id}</small>
          </div>
        )}
      </section>
    </>
  );
}
