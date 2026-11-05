"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Sparkles } from "lucide-react";
import { niches } from "@/config/catalog";
import {
  generationLeadsAction,
  selectAllGenerationAction,
  previewGenerationAction,
  generateAction,
} from "@/app/(admin)/prototipos/actions";
import {
  GENERATION_LIMITS,
  type GenerationLeadPage,
  type GenerationMode,
  type GenerationPlan,
  type GenerationResult,
  type LeadFilter,
} from "@/lib/generation/contracts";
import {
  startGenerationRun,
  nextGenerationBatch,
  summarizeRun,
  type GenerationRun,
} from "@/lib/generation/batch-runner";
const reasonLabels: Record<string, string> = {
  lead_missing: "Lead não encontrado.",
  invalid_lead_data: "Dados do lead inválidos ou acima dos limites.",
  active_template_missing: "Não há template ativo compatível com a escolha.",
  already_has_prototype: "Já possui um protótipo.",
};
export function GenerationPanel({
  initial,
  error: initialError,
}: {
  initial: GenerationLeadPage;
  error?: string;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [filters, setFilters] = useState<LeadFilter>({
    query: "",
    niche: "",
    page: 0,
  });
  const [applied, setApplied] = useState(filters);
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<GenerationMode>("auto");
  const [plan, setPlan] = useState<GenerationPlan | null>(null);
  const [pending, setPending] = useState<GenerationRun | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState(initialError ?? "");
  const [busy, setBusy] = useState(false);
  const locked = busy || pending !== null;
  function resetPlan() {
    setPlan(null);
    setResult(null);
    setError("");
  }
  async function load(next: LeadFilter, preserveSelection = false) {
    setBusy(true);
    setError("");
    try {
      const response = await generationLeadsAction(next);
      if (response.ok) {
        setData(response.data);
        setApplied(next);
        setFilters(next);
        if (!preserveSelection) setSelected([]);
        setPlan(null);
      } else setError(response.message);
    } catch {
      setError("Não foi possível consultar os leads.");
    } finally {
      setBusy(false);
    }
  }
  function toggle(id: string) {
    resetPlan();
    setSelected((ids) =>
      ids.includes(id)
        ? ids.filter((i) => i !== id)
        : ids.length < GENERATION_LIMITS.maxSelection
          ? [...ids, id]
          : ids,
    );
  }
  async function selectAll() {
    setBusy(true);
    resetPlan();
    try {
      const response = await selectAllGenerationAction(applied);
      if (response.ok) setSelected(response.data);
      else setError(response.message);
    } catch {
      setError("Não foi possível selecionar os resultados.");
    } finally {
      setBusy(false);
    }
  }
  async function preview(ids = selected) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await previewGenerationAction({ leadIds: ids, mode });
      if (response.ok) {
        setSelected(ids);
        setPlan(response.data);
      } else {
        setPlan(null);
        setError(response.message);
      }
    } catch {
      setError("Não foi possível conferir a seleção.");
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    if (!plan && !pending) return;
    let current = pending ?? startGenerationRun(plan!, mode);
    setPending(current);
    setBusy(true);
    setError("");
    try {
      while (current.remaining.length) {
        const step = await nextGenerationBatch(current, {
          preview: (leadIds, mode) =>
            previewGenerationAction({ leadIds, mode }),
          commit: generateAction,
          onPending: setPending,
          newId: () => crypto.randomUUID(),
        });
        current = step.run;
        setResult(summarizeRun(current));
        if (!step.ok) {
          setError(step.message);
          if (step.stale) {
            setPending(null);
            setPlan(null);
            setSelected(current.remaining);
          } else setPending(current);
          return;
        }
        setPending(current);
      }
      setPending(null);
      setSelected([]);
      setPlan(null);
    } catch {
      setError(
        "Resultado ainda não confirmado. Retome a mesma tentativa para consultar ou concluir sem duplicar os protótipos.",
      );
    } finally {
      if (current.completed) {
        const refreshed = await generationLeadsAction(applied).catch(
          () => null,
        );
        if (refreshed?.ok) setData(refreshed.data);
        router.refresh();
      }
      setBusy(false);
    }
  }
  return (
    <section className="panel generation-panel" id="gerar">
      <div className="section-heading">
        <div>
          <h2>Transforme leads em rascunhos</h2>
          <p>
            Selecione até 500 leads. A geração processa lotes sucessivos de 25,
            preserva os protótipos existentes e mantém os dados privados.
          </p>
        </div>
        <Sparkles size={20} />
      </div>
      <fieldset disabled={locked} className="generation-controls">
        <form
          className="filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            void load({ ...filters, page: 0 });
          }}
        >
          <label className="search-input">
            <Search size={16} />
            <input
              aria-label="Buscar leads por nome"
              value={filters.query}
              maxLength={100}
              placeholder="Buscar leads por nome"
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
            />
          </label>
          <select
            aria-label="Filtrar leads por nicho"
            value={filters.niche}
            onChange={(e) =>
              setFilters({
                ...filters,
                niche: e.target.value as LeadFilter["niche"],
              })
            }
          >
            <option value="">Todos os nichos</option>
            {niches.map((n) => (
              <option key={n.id} value={n.id}>
                {n.shortName}
              </option>
            ))}
          </select>
          <button className="button" type="submit">
            Buscar
          </button>
        </form>
        <div className="import-actions">
          <span>
            {data.total} resultado(s) · {data.eligible} sem protótipo ·{" "}
            {selected.length} selecionado(s)
          </span>
          <button
            className="button"
            disabled={!data.eligible}
            onClick={() => void selectAll()}
          >
            Selecionar todos os elegíveis
          </button>
          <button
            className="text-link"
            onClick={() => {
              setSelected([]);
              resetPlan();
            }}
          >
            Limpar seleção
          </button>
        </div>
        <div
          className="table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Seleção de leads com rolagem horizontal"
        >
          <table>
            <thead>
              <tr>
                <th>Selecionar</th>
                <th>Empresa</th>
                <th>Nicho / cidade</th>
                <th>Situação</th>
                <th>Geração individual</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${lead.name}`}
                      disabled={
                        lead.hasPrototype ||
                        (!selected.includes(lead.id) &&
                          selected.length >= GENERATION_LIMITS.maxSelection)
                      }
                      checked={selected.includes(lead.id)}
                      onChange={() => toggle(lead.id)}
                    />
                  </td>
                  <td>
                    <strong>{lead.name}</strong>
                  </td>
                  <td>
                    {niches.find((n) => n.id === lead.niche)?.shortName}
                    <small>
                      {[lead.city, lead.state].filter(Boolean).join(" / ") ||
                        "Localização não informada"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${lead.hasPrototype ? "status-rascunho" : "status-publicado"}`}
                    >
                      {lead.hasPrototype ? "Já possui protótipo" : "Disponível"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-link"
                      disabled={lead.hasPrototype}
                      onClick={() => void preview([lead.id])}
                    >
                      Conferir geração
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.items.length && (
          <div className="empty-state">
            <h3>Nenhum lead encontrado</h3>
            <p>Importe leads ou ajuste os filtros.</p>
          </div>
        )}
        <div className="import-actions">
          <button
            className="button"
            disabled={applied.page === 0}
            onClick={() =>
              void load({ ...applied, page: applied.page - 1 }, true)
            }
          >
            Anterior
          </button>
          <span>
            Página {applied.page + 1} de{" "}
            {Math.max(1, Math.ceil(data.total / 25))}
          </span>
          <button
            className="button"
            disabled={(applied.page + 1) * 25 >= data.total}
            onClick={() =>
              void load({ ...applied, page: applied.page + 1 }, true)
            }
          >
            Próxima
          </button>
          <label>
            Distribuição{" "}
            <select
              value={mode}
              aria-label="Distribuição de templates"
              onChange={(e) => {
                setMode(e.target.value as GenerationMode);
                resetPlan();
              }}
            >
              <option value="auto">Automática A/B por nicho</option>
              <option value="A">Manual: variante A</option>
              <option value="B">Manual: variante B</option>
            </select>
          </label>
          <button
            className="button primary"
            disabled={!selected.length}
            onClick={() => void preview()}
          >
            Conferir {selected.length} selecionado(s)
          </button>
        </div>
      </fieldset>
      {plan && (
        <div className="generation-summary">
          <h3>Resumo antes de gerar</h3>
          <p>
            Selecionados: {plan.selected} · Elegíveis: {plan.eligible} ·
            Ignorados: {plan.ignored} · Impedidos: {plan.blocked}
          </p>
          <div className="import-distribution">
            {niches.map((n) => (
              <span key={n.id}>
                {n.shortName}: A{" "}
                <b>
                  {
                    plan.items.filter(
                      (i) =>
                        i.niche === n.id &&
                        i.status === "eligible" &&
                        i.variant === "A",
                    ).length
                  }
                </b>{" "}
                / B{" "}
                <b>
                  {
                    plan.items.filter(
                      (i) =>
                        i.niche === n.id &&
                        i.status === "eligible" &&
                        i.variant === "B",
                    ).length
                  }
                </b>
              </span>
            ))}
          </div>
          <p>
            Em empate, a variante A recebe o próximo lead. Somente modelos
            ativos são utilizados. A confirmação verifica novamente a versão dos
            leads e a atribuição prevista.
          </p>
          {plan.items
            .filter((i) => i.reason)
            .map((i) => (
              <p key={i.leadId}>
                {i.name}: {reasonLabels[i.reason!] ?? "Revisão necessária."}
              </p>
            ))}
          <button
            className="button primary"
            disabled={busy || !!plan.blocked || !plan.eligible}
            onClick={() => void generate()}
          >
            <Check size={16} />
            {pending
              ? "Retomar a mesma tentativa"
              : `Gerar ${plan.eligible} rascunho(s)`}
          </button>
        </div>
      )}
      {busy && (
        <p className="import-notice" role="status">
          Processando…{" "}
          {pending
            ? `${pending.completed} de ${pending.plan.selected} lead(s) confirmados.`
            : ""}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      {pending && !busy && (
        <div className="import-actions">
          <p>
            {pending.completed} de {pending.plan.selected} lead(s) confirmados.
            O lote pendente mantém o mesmo identificador até confirmar seu
            resultado.
          </p>
          {!plan && (
            <button className="button primary" onClick={() => void generate()}>
              Retomar tentativa
            </button>
          )}
          <button
            className="button"
            onClick={() => {
              setPending(null);
              setPlan(null);
              void load(applied);
              router.refresh();
            }}
          >
            Conferir o banco e iniciar nova revisão
          </button>
        </div>
      )}
      {result && (
        <div className="import-result" role="status">
          <h3>
            {selected.length ? "Progresso confirmado" : "Geração confirmada"}
          </h3>
          <p>
            {result.created} rascunho(s) criado(s) · {result.ignored} lead(s) já
            possuíam protótipo. Nenhuma publicação foi realizada.
          </p>
          {result.prototypes.length > 0 && (
            <a
              className="button primary"
              href={`/publicacoes?ids=${result.prototypes
                .slice(-25)
                .map((p) => p.id)
                .join(",")}`}
            >
              Revisar para publicação
              {result.prototypes.length > 25 ? " — últimos 25 criados" : ""}
            </a>
          )}
        </div>
      )}
    </section>
  );
}
