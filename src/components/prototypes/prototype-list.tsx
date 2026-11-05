"use client";
import "@/templates/restaurants/digital/digital.css";
import "@/templates/restaurants/premium/premium.css";
import { RestaurantControls } from "./restaurant-controls";
import "@/templates/real-estate/premium/premium.css";
import "@/templates/real-estate/personal/personal.css";
import { useState } from "react";
import { DraftPreview } from "./draft-preview";
import { RealEstateControls } from "./real-estate-controls";
import { LawModernControls } from "./law-modern-controls";
import { LawDesignEditor } from "./law-design-editor";
import { ClinicDesignEditor } from "./clinic-design-editor";
import {
  renderPersistedTemplate,
  templateRenderers,
} from "@/templates/registry";
import "@/templates/clinics/clinics.css";
import "@/templates/clinics/premium/premium.css";
import "@/templates/clinics/appointments/appointments.css";
import "@/templates/law/classic/classic.css";
import "@/templates/law/modern/modern.css";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { niches } from "@/config/catalog";
import {
  prototypeListAction,
  editPrototypeAction,
} from "@/app/(admin)/prototipos/actions";
import {
  personalizationSchema,
  type Personalization,
  type ManagedPrototype,
  type PrototypePage,
  type PrototypeFilter,
} from "@/lib/generation/contracts";
import type { TemplateRow } from "@/types/database";
import { PrototypeTable, prototypeStatusLabels } from "./prototype-table";
import { PublicationPanel } from "./publication-panel";
const labels: Record<keyof Personalization["confirmed"], string> = {
  name: "Nome comercial",
  niche: "Nicho",
  specialty: "Especialidade",
  city: "Cidade",
  state: "UF",
  address: "Endereço",
  phone: "Telefone",
  whatsapp: "WhatsApp",
  website: "Site existente",
  instagram: "Instagram",
  description: "Descrição",
  services: "Serviços",
};
const initialFilters: PrototypeFilter = {
  query: "",
  niche: "",
  status: "",
  templateId: "",
  page: 0,
};
export function PrototypeList({
  initial,
  templates,
  error: initialError,
  initialSelected,
  publicBase = null,
}: {
  initial: PrototypePage;
  templates: TemplateRow[];
  error?: string;
  initialSelected?: ManagedPrototype;
  publicBase?: string | null;
}) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [filters, setFilters] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const [selected, setSelected] = useState<ManagedPrototype | null>(
    initialSelected ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  async function load(next: PrototypeFilter) {
    setBusy(true);
    setError("");
    try {
      const response = await prototypeListAction(next);
      if (response.ok) {
        setData(response.data);
        setApplied(next);
        setFilters(next);
        setSelected(null);
      } else setError(response.message);
    } catch {
      setError("Não foi possível consultar os protótipos.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Seus protótipos</h2>
            <p>
              Dados persistidos, com prévia técnica e edição administrativa.
              Gerencie links individuais ou acesse a Central de Publicação.
            </p>
          </div>
        </div>
        <form
          className="filter-bar"
          onSubmit={(e) => {
            e.preventDefault();
            void load({ ...filters, page: 0 });
          }}
        >
          <label className="search-input">
            <Search size={18} />
            <input
              aria-label="Buscar protótipos por nome"
              placeholder="Buscar empresa…"
              maxLength={100}
              value={filters.query}
              onChange={(e) =>
                setFilters({ ...filters, query: e.target.value })
              }
            />
          </label>
          <select
            aria-label="Filtrar protótipos por nicho"
            value={filters.niche}
            onChange={(e) =>
              setFilters({
                ...filters,
                niche: e.target.value as PrototypeFilter["niche"],
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
          <select
            aria-label="Filtrar por status"
            value={filters.status}
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as PrototypeFilter["status"],
              })
            }
          >
            <option value="">Todos os status</option>
            {Object.entries(prototypeStatusLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por template"
            value={filters.templateId}
            onChange={(e) =>
              setFilters({ ...filters, templateId: e.target.value })
            }
          >
            <option value="">Todos os templates</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.variant}
              </option>
            ))}
          </select>
          <button className="button" disabled={busy} type="submit">
            Buscar
          </button>
        </form>
        <div className="results-bar">
          <span aria-live="polite">{data.total} protótipo(s) no resultado</span>
          <button
            className="text-link"
            disabled={busy}
            onClick={() => void load(initialFilters)}
          >
            <X size={14} />
            Limpar filtros
          </button>
          <span>Até 25 por página</span>
        </div>
        <PrototypeTable
          publicBase={publicBase}
          items={data.items}
          onInspect={setSelected}
          publication={(id) => {
            const publication = data.items.find(
              (item) => item.id === id,
            )?.publication;
            return (
              <PublicationPanel
                id={id}
                activeVersion={
                  publication && !publication.unpublished_at
                    ? publication.publication_version
                    : undefined
                }
              />
            );
          }}
        />
        <div className="import-actions">
          <button
            className="button"
            disabled={busy || applied.page === 0}
            onClick={() => void load({ ...applied, page: applied.page - 1 })}
          >
            Anterior
          </button>
          <span>
            Página {applied.page + 1} de{" "}
            {Math.max(1, Math.ceil(data.total / 25))}
          </span>
          <button
            className="button"
            disabled={busy || (applied.page + 1) * 25 >= data.total}
            onClick={() => void load({ ...applied, page: applied.page + 1 })}
          >
            Próxima
          </button>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
      </section>
      {selected && (
        <PrototypeInspector
          key={`${selected.id}:${selected.revision}`}
          item={selected}
          templates={templates}
          onClose={() => setSelected(null)}
          onSaved={async () => {
            await load(applied);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
function PrototypeInspector({
  item,
  templates,
  onClose,
  onSaved,
}: {
  item: ManagedPrototype;
  templates: TemplateRow[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const parsed = personalizationSchema.safeParse(item.customization_data);
  if (!parsed.success)
    return (
      <section className="panel generation-summary">
        <h2>Prévia técnica</h2>
        <p>
          Este registro anterior não possui personalização no contrato atual.
          Seus dados foram preservados; revise a migração antes de editar.
        </p>
        <button className="button" onClick={onClose}>
          Fechar
        </button>
      </section>
    );
  return (
    <PersonalizationEditor
      item={item}
      initial={parsed.data}
      templates={templates}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}
function PersonalizationEditor({
  item,
  initial,
  templates,
  onClose,
  onSaved,
}: {
  item: ManagedPrototype;
  initial: Personalization;
  templates: TemplateRow[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [realEstateDesign, setRealEstateDesign] = useState(
    initial.realEstateDesign,
  );
  const [confirmed, setConfirmed] = useState(initial.confirmed);
  const [restaurantDesign, setRestaurantDesign] = useState(
    initial.restaurantDesign,
  );
  const [clinicDesign, setClinicDesign] = useState(initial.clinicDesign);
  const [lawDesign, setLawDesign] = useState(initial.lawDesign);
  const [lawModernDesign, setLawModernDesign] = useState(
    initial.lawModernDesign,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(390);
  const [illustrative, setIllustrative] = useState(initial.illustrative);
  const [servicesText, setServicesText] = useState(
    initial.confirmed.services.join("\n"),
  );
  const [sectionsText, setSectionsText] = useState(
    initial.illustrative.plannedSections.join("\n"),
  );
  const [templateId, setTemplateId] = useState(item.template_id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const draft = {
    ...initial,
    realEstateDesign,
    restaurantDesign,
    clinicDesign,
    lawDesign,
    lawModernDesign,
    confirmedOrigin: "admin_review" as const,
    confirmed: {
      ...confirmed,
      services: servicesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    },
    illustrative: {
      ...illustrative,
      plannedSections: sectionsText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    },
    missingFields: Object.entries({
      ...confirmed,
      services: servicesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    })
      .filter(([, v]) => v === null || (Array.isArray(v) && !v.length))
      .map(([k]) => k),
  };
  const validation = personalizationSchema.safeParse(draft);
  const hasUnsavedChanges =
    templateId !== item.template_id ||
    JSON.stringify({ ...draft, confirmedOrigin: initial.confirmedOrigin }) !==
      JSON.stringify(initial);
  const editable = item.status === "draft";
  const currentTemplate = templates.find((t) => t.id === templateId);
  const hasPreview = Boolean(
    currentTemplate && currentTemplate.slug in templateRenderers,
  );
  async function save() {
    if (!validation.success) return;
    setBusy(true);
    setError("");
    try {
      const result = await editPrototypeAction({
        id: item.id,
        expectedRevision: item.revision,
        templateId,
        personalization: validation.data,
      });
      if (result.ok) await onSaved();
      else setError(result.message);
    } catch {
      setError(
        "Resultado não confirmado. Recarregue o registro antes de tentar outra edição.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel prototype-inspector">
      <div className="section-heading">
        <div>
          <h2>Personalização do protótipo</h2>
          <p>
            Revise os dados, ajuste a identidade e confira o site antes de
            salvar.
          </p>
        </div>
        <button
          className="icon-button"
          aria-label="Fechar prévia técnica"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div
        className="editor-state"
        data-dirty={hasUnsavedChanges}
        role="status"
        aria-live="polite"
      >
        <strong>
          {editable
            ? hasUnsavedChanges
              ? "Alterações não salvas"
              : "Nenhuma alteração pendente"
            : "Somente leitura"}
        </strong>
        <span>
          Revisão {item.revision} ·{" "}
          {validation.success
            ? "Dados válidos para revisão"
            : "Revise os campos indicados"}
        </span>
      </div>
      <div className="generation-summary">
        <strong>{initial.confirmed.name}</strong>
        <p>
          {item.template_name} · {item.variant} ·{" "}
          {prototypeStatusLabels[item.status]}
        </p>
        <p>
          Origem dos dados:{" "}
          {initial.confirmedOrigin === "lead_snapshot"
            ? "dados do lead no momento da geração"
            : "revisão administrativa"}
          . As edições não alteram o lead original.
        </p>
        <p>
          Campos ausentes:{" "}
          {initial.missingFields.map((f) => labels[f]).join(", ") || "Nenhum"}.
        </p>
        <code className="prototype-slug">/p/{item.slug}</code>
        <p>
          Identificador reservado e estável; nenhum link público está
          disponível.
        </p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy || !editable} className="generation-controls">
          <div className="generation-summary">
            <h3>Dados confirmados</h3>
            <p>
              Preencha apenas informações verificadas. Não acrescente
              depoimentos, credenciais ou ofertas sem confirmação.
            </p>
          </div>
          <div className="import-field-grid">
            {(Object.keys(labels) as (keyof typeof confirmed)[]).map((key) =>
              key === "niche" ? (
                <label key={key}>
                  {labels[key]}
                  <input
                    className="import-input"
                    value={
                      niches.find((n) => n.id === confirmed.niche)?.name ??
                      confirmed.niche
                    }
                    disabled
                  />
                </label>
              ) : key === "services" ? (
                <label key={key}>
                  {labels[key]}
                  <textarea
                    value={servicesText}
                    onChange={(e) => setServicesText(e.target.value)}
                  />
                  <small>Um serviço confirmado por linha.</small>
                </label>
              ) : (
                <label key={key}>
                  {labels[key]}
                  {key === "description" ? (
                    <textarea
                      value={confirmed.description ?? ""}
                      onChange={(e) =>
                        setConfirmed({
                          ...confirmed,
                          description: e.target.value || null,
                        })
                      }
                    />
                  ) : (
                    <input
                      className="import-input"
                      value={confirmed[key] ?? ""}
                      onChange={(e) =>
                        setConfirmed({
                          ...confirmed,
                          [key]: e.target.value || null,
                        })
                      }
                    />
                  )}
                </label>
              ),
            )}
          </div>
          <div className="generation-summary illustrative-content">
            <h3>Conteúdo de demonstração</h3>
            <p>
              Textos ilustrativos, separados das informações confirmadas. Não
              representam fatos reais sobre a empresa.
            </p>
            <label>
              Título-base
              <input
                className="import-input"
                value={illustrative.headline}
                onChange={(e) =>
                  setIllustrative({ ...illustrative, headline: e.target.value })
                }
              />
            </label>
            <label>
              Introdução demonstrativa
              <textarea
                value={illustrative.introduction}
                onChange={(e) =>
                  setIllustrative({
                    ...illustrative,
                    introduction: e.target.value,
                  })
                }
              />
            </label>
            <label>
              Seções planejadas
              <textarea
                value={sectionsText}
                onChange={(e) => setSectionsText(e.target.value)}
              />
            </label>
          </div>
          {item.niche === "imobiliarias" && (
            <RealEstateControls
              variant={currentTemplate?.variant ?? item.variant}
              value={realEstateDesign}
              onChange={setRealEstateDesign}
            />
          )}
          {item.niche === "restaurantes" && (
            <RestaurantControls
              variant={currentTemplate?.variant ?? item.variant}
              value={restaurantDesign}
              onChange={setRestaurantDesign}
            />
          )}
          {item.niche === "advocacia" &&
            (currentTemplate?.variant ?? item.variant) === "B" && (
              <LawModernControls
                value={lawModernDesign}
                onChange={setLawModernDesign}
                areas={servicesText
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)}
                onAreasChange={(areas) => setServicesText(areas.join("\n"))}
              />
            )}
          {item.niche === "advocacia" &&
            (currentTemplate?.variant ?? item.variant) === "A" && (
              <LawDesignEditor
                value={lawDesign}
                onChange={setLawDesign}
                areas={servicesText
                  .split(/\r?\n/)
                  .map((s) => s.trim())
                  .filter(Boolean)}
                onAreasChange={(areas) => setServicesText(areas.join("\n"))}
              />
            )}
          {item.niche === "clinicas" && (
            <ClinicDesignEditor
              variant={
                templates.find((t) => t.id === templateId)?.variant ??
                item.variant
              }
              specialty={confirmed.specialty}
              onServicesChange={(services) =>
                setServicesText(services.join("\n"))
              }
              services={servicesText
                .split(/\r?\n/)
                .map((s) => s.trim())
                .filter(Boolean)}
              value={clinicDesign}
              onChange={setClinicDesign}
            />
          )}
          <div className="import-actions editor-savebar">
            <label>
              Template compatível{" "}
              <select
                aria-label="Trocar template do protótipo"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates
                  .filter(
                    (t) =>
                      t.niche === item.niche &&
                      (t.status === "active" || t.id === item.template_id),
                  )
                  .map((t) => (
                    <option
                      key={t.id}
                      value={t.id}
                      disabled={t.status !== "active"}
                    >
                      {t.name} · {t.variant}
                      {t.status !== "active" ? " (inativo)" : ""}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="button primary"
              disabled={
                !validation.success ||
                !templates.some(
                  (t) => t.id === templateId && t.status === "active",
                )
              }
              type="submit"
            >
              Salvar revisão
            </button>
          </div>
        </fieldset>
      </form>
      <div className="import-actions">
        <button
          type="button"
          className="button"
          disabled={!validation.success || !hasPreview}
          onClick={() => setShowPreview(!showPreview)}
        >
          Pré-visualizar alterações sem salvar
        </button>
        <label>
          Largura
          <select
            value={previewWidth}
            onChange={(e) => setPreviewWidth(Number(e.target.value))}
          >
            {[360, 390, 768, 1024, 1440].map((w) => (
              <option key={w} value={w}>
                {w}px
              </option>
            ))}
          </select>
        </label>
      </div>
      {showPreview && validation.success && hasPreview && (
        <div
          style={{ overflow: "auto", maxHeight: 800, border: "1px solid #ddd" }}
        >
          <DraftPreview width={previewWidth}>
            {(() => {
              const t = templates.find((t) => t.id === templateId);
              return t ? renderPersistedTemplate(t, validation.data) : null;
            })()}
          </DraftPreview>
        </div>
      )}
      {!editable && (
        <p className="import-notice">
          A edição nesta fase é restrita a rascunhos.
        </p>
      )}
      {!validation.success && (
        <div className="generation-summary" role="alert">
          {validation.error.issues.slice(0, 12).map((issue, index) => (
            <p key={index}>
              {issue.path.join(" / ")}: {issue.message}
            </p>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
