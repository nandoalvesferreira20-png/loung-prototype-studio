"use client";
import { ClinicAppointmentsControls } from "./clinic-appointments-controls";
import type { ClinicDesign } from "@/lib/generation/contracts";
const assets = [
  "clinic-reception-hero",
  "doctor-consultation-main",
  "clinic-room-structure",
  "consultation-detail",
];
export function ClinicDesignEditor({
  value,
  onChange,
  services,
  variant = "A",
  onServicesChange,
  specialty,
}: {
  value: ClinicDesign | undefined;
  services: string[];
  variant?: "A" | "B";
  onServicesChange?: (value: string[]) => void;
  specialty?: string | null;
  onChange: (value: ClinicDesign | undefined) => void;
}) {
  const d = value ?? { version: 1 };
  const sections = d.sections ?? ["services", "about", "structure", "contact"];
  if (variant === "B")
    return (
      <ClinicAppointmentsControls
        value={d.appointments}
        services={services}
        onServicesChange={onServicesChange ?? (() => {})}
        specialty={specialty ?? null}
        onChange={(appointments) => onChange({ ...d, appointments })}
      />
    );
  return (
    <details className="generation-summary" open>
      <summary>Personalização visual · Template A</summary>
      <p>
        Imagens locais ilustrativas. Use apenas imagens compatíveis com a
        especialidade. Novos campos exigem a migration da fase 4.2 no Supabase.
      </p>
      <details open>
        <summary>Identidade e conteúdo</summary>
        <div className="import-field-grid">
          {(
            [
              ["subtitle", "Subtítulo da marca"],
              ["heroDescription", "Descrição do hero"],
              ["aboutTitle", "Título Sobre"],
              ["servicesTitle", "Título Especialidades"],
              ["structureTitle", "Título Estrutura"],
              ["contactTitle", "Título da faixa de contato"],
              ["cta", "Texto dos botões"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                className="import-input"
                value={d[key] ?? ""}
                onChange={(e) => onChange({ ...d, [key]: e.target.value })}
              />
            </label>
          ))}
          <label>
            Logotipo (arquivo local em /templates/clinics/)
            <input
              className="import-input"
              value={d.logo ?? ""}
              onChange={(e) => onChange({ ...d, logo: e.target.value || null })}
            />
          </label>
        </div>
      </details>
      <details>
        <summary>Imagens e enquadramento</summary>
        <div className="import-field-grid">
          {(
            [
              ["hero", "Hero"],
              ["institutional", "Sobre"],
              ["room", "Consultório"],
              ["detail", "Detalhe"],
            ] as const
          ).map(([slot, label]) => (
            <div key={slot}>
              <label>
                {label}
                <select
                  value={
                    d.images?.[slot] === null
                      ? "none"
                      : (d.images?.[slot] ?? "")
                  }
                  onChange={(e) => {
                    const images = { ...d.images };
                    if (!e.target.value) delete images[slot];
                    else
                      images[slot] =
                        e.target.value === "none" ? null : e.target.value;
                    onChange({ ...d, images });
                  }}
                >
                  <option value="">
                    Padrão compatível com a especialidade
                  </option>
                  <option value="none">Sem fotografia</option>
                  {assets.map((a) => (
                    <option
                      key={a}
                      value={`/templates/clinics/shared/${a}.png`}
                    >
                      {a}
                    </option>
                  ))}
                  {d.images?.[slot] &&
                    !assets.some(
                      (a) =>
                        d.images?.[slot] ===
                        `/templates/clinics/shared/${a}.png`,
                    ) && (
                      <option value={d.images[slot]!}>{d.images[slot]}</option>
                    )}
                </select>
              </label>
              <label>
                Ou caminho de imagem local
                <input
                  className="import-input"
                  value={d.images?.[slot] ?? ""}
                  placeholder="/templates/clinics/empresa/foto.webp"
                  onChange={(e) =>
                    onChange({
                      ...d,
                      images: { ...d.images, [slot]: e.target.value || null },
                    })
                  }
                />
              </label>
              <label>
                Enquadramento
                <select
                  value={d.positions?.[slot] ?? "center"}
                  onChange={(e) =>
                    onChange({
                      ...d,
                      positions: {
                        ...d.positions,
                        [slot]: e.target.value as "center" | "left" | "right",
                      },
                    })
                  }
                >
                  <option value="center">Centro</option>
                  <option value="left">Esquerda</option>
                  <option value="right">Direita</option>
                </select>
              </label>
            </div>
          ))}
        </div>
      </details>
      <details>
        <summary>Aparência, ordem e visibilidade</summary>
        <div className="import-field-grid">
          {(
            [
              ["primary", "Cor principal"],
              ["button", "Botões"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <select
                value={d[key] ?? "#405638"}
                onChange={(e) => onChange({ ...d, [key]: e.target.value })}
              >
                <option value="#405638">Verde natural</option>
                <option value="#244c45">Verde profundo</option>
                <option value="#414b64">Azul ardósia</option>
              </select>
            </label>
          ))}
          <label>
            Fundo
            <select
              value={d.secondary ?? "#faf8f5"}
              onChange={(e) =>
                onChange({
                  ...d,
                  secondary: e.target.value as ClinicDesign["secondary"],
                })
              }
            >
              <option value="#faf8f5">Marfim</option>
              <option value="#f2f5f3">Sálvia clara</option>
              <option value="#f6f5fa">Lavanda clara</option>
            </select>
          </label>
        </div>
        {(
          [
            ["services", "Especialidades"],
            ["about", "Sobre"],
            ["structure", "Estrutura"],
            ["contact", "Faixa de contato"],
          ] as const
        ).map(([id, label]) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={sections.includes(id)}
              onChange={(e) =>
                onChange({
                  ...d,
                  sections: e.target.checked
                    ? [...sections, id]
                    : sections.filter((s) => s !== id),
                })
              }
            />
            {label}
          </label>
        ))}
        <p>
          Ordem atual: {sections.join(" → ")}. Desative e reative uma seção para
          movê-la ao final.
        </p>
      </details>
      <details>
        <summary>Serviços e descrições</summary>
        <p>Edite a lista de serviços confirmados nos dados da clínica acima.</p>
        {services.map((service) => (
          <label key={service}>
            {service}
            <textarea
              value={d.serviceDescriptions?.[service] ?? ""}
              onChange={(e) =>
                onChange({
                  ...d,
                  serviceDescriptions: {
                    ...d.serviceDescriptions,
                    [service]: e.target.value,
                  },
                })
              }
            />
          </label>
        ))}
      </details>
      <details>
        <summary>Avaliações reais autorizadas</summary>
        <p>
          Adicione somente avaliações autênticas com permissão de exibição e
          link para a fonte. A seção fica oculta quando a lista está vazia.
        </p>
        {(d.reviews ?? []).map((review, i) => (
          <div key={i} className="generation-summary">
            {(
              [
                ["name", "Nome autorizado"],
                ["quote", "Avaliação original"],
                ["source", "URL da fonte"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  className="import-input"
                  value={review[key]}
                  onChange={(e) =>
                    onChange({
                      ...d,
                      reviews: d.reviews?.map((r, j) =>
                        j === i ? { ...r, [key]: e.target.value } : r,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="button"
              onClick={() =>
                onChange({
                  ...d,
                  reviews: d.reviews?.filter((_, j) => j !== i),
                })
              }
            >
              Remover da exibição
            </button>
          </div>
        ))}
        <button
          type="button"
          className="button"
          disabled={(d.reviews?.length ?? 0) >= 12}
          onClick={() =>
            onChange({
              ...d,
              reviews: [
                ...(d.reviews ?? []),
                { name: "", quote: "", source: "", authorized: true },
              ],
            })
          }
        >
          Confirmo a autorização e quero adicionar uma avaliação real
        </button>
      </details>
      <button
        type="button"
        className="button"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar somente as opções visuais padrão? Textos e dados confirmados serão preservados.",
            )
          )
            onChange(undefined);
        }}
      >
        Restaurar aparência padrão
      </button>
    </details>
  );
}
