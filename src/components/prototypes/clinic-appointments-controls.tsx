"use client";
import { useState } from "react";
import {
  appointmentContactIds,
  appointmentSectionIds,
  appointmentSteps,
  type AppointmentPhoto,
  type AppointmentsDesign,
  type AppointmentSection,
} from "@/lib/generation/appointments-design";
import { resolveSpecialty } from "@/templates/clinics/shared/specialties";
import { clinicDefaultPhoto } from "@/templates/clinics/shared/default-photography";
const assetNames = [
  "doctor-consultation-main",
  "clinic-reception-hero",
  "clinic-room-structure",
  "consultation-detail",
];
const sectionLabels: Record<AppointmentSection, string> = {
  services: "Especialidades",
  about: "Sobre",
  process: "Como funciona",
  gallery: "Galeria",
  conversion: "Faixa de contato",
  contact: "Contato",
};
export function ClinicAppointmentsControls({
  value,
  onChange,
  services,
  onServicesChange,
  specialty,
}: {
  value: AppointmentsDesign | undefined;
  onChange: (value: AppointmentsDesign | undefined) => void;
  services: string[];
  onServicesChange: (value: string[]) => void;
  specialty: string | null;
}) {
  const d = value ?? { version: 1 };
  const [newService, setNewService] = useState("");
  const sections = d.sections ?? [...appointmentSectionIds];
  const defaultPhoto = (file: string): AppointmentPhoto => ({
    src: clinicDefaultPhoto(file, resolveSpecialty(specialty)).src,
    illustrative: true,
    position: "center",
  });
  const gallery = d.gallery ?? [
    defaultPhoto("clinic-reception-hero"),
    defaultPhoto("clinic-room-structure"),
    defaultPhoto("consultation-detail"),
  ];
  const textField = (
    key: keyof AppointmentsDesign,
    label: string,
    multiline = false,
  ) => (
    <label key={key}>
      {label}
      {multiline ? (
        <textarea
          value={typeof d[key] === "string" ? (d[key] as string) : ""}
          onChange={(e) => onChange({ ...d, [key]: e.target.value })}
        />
      ) : (
        <input
          className="import-input"
          value={typeof d[key] === "string" ? (d[key] as string) : ""}
          onChange={(e) => onChange({ ...d, [key]: e.target.value })}
        />
      )}
    </label>
  );
  const move = <T,>(items: T[], i: number, offset: number) => {
    const next = [...items];
    [next[i], next[i + offset]] = [next[i + offset], next[i]];
    return next;
  };
  const photoFields = (
    photo: AppointmentPhoto | undefined,
    label: string,
    update: (next: AppointmentPhoto | undefined) => void,
    defaults: AppointmentPhoto,
  ) => (
    <fieldset className="generation-summary">
      <legend>{label}</legend>
      <label>
        Imagem
        <select
          value={photo?.src === null ? "none" : (photo?.src ?? "default")}
          onChange={(e) =>
            update(
              e.target.value === "default"
                ? undefined
                : {
                    ...(photo ?? defaults),
                    src: e.target.value === "none" ? null : e.target.value,
                  },
            )
          }
        >
          <option value="default">Padrão compatível com a especialidade</option>
          <option value="none">Sem imagem</option>
          {assetNames.map((name) => (
            <option key={name} value={`/templates/clinics/shared/${name}.png`}>
              {name}
            </option>
          ))}
          {photo?.src &&
            !assetNames.some(
              (name) => photo.src === `/templates/clinics/shared/${name}.png`,
            ) && <option value={photo.src}>{photo.src}</option>}
        </select>
      </label>
      <label>
        Ou caminho de arquivo local
        <input
          className="import-input"
          placeholder="/templates/clinics/empresa/foto.webp"
          value={photo?.src ?? ""}
          onChange={(e) => update({ ...photo, src: e.target.value || null })}
        />
      </label>
      <label>
        Enquadramento
        <select
          value={photo?.position ?? "center"}
          onChange={(e) =>
            update({
              ...photo,
              src: photo?.src === undefined ? defaults.src : photo.src,
              position: e.target.value as AppointmentPhoto["position"],
            })
          }
        >
          <option value="center">Centro</option>
          <option value="left">Esquerda</option>
          <option value="right">Direita</option>
          <option value="top">Topo</option>
          <option value="bottom">Base</option>
        </select>
      </label>
      <label>
        Legenda
        <input
          className="import-input"
          value={photo?.caption ?? ""}
          onChange={(e) =>
            update({
              ...photo,
              src: photo?.src === undefined ? defaults.src : photo.src,
              caption: e.target.value,
            })
          }
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={photo?.illustrative !== false}
          onChange={(e) =>
            update({
              ...photo,
              src: photo?.src === undefined ? defaults.src : photo.src,
              illustrative: e.target.checked,
            })
          }
        />
        Imagem ilustrativa. Desmarque somente para fotografia real autorizada da
        clínica.
      </label>
    </fieldset>
  );
  return (
    <details className="generation-summary" open>
      <summary>Personalização visual · Template B</summary>
      <p>
        Opções exclusivas do B. As personalizações visuais do A são preservadas.
        Para salvar estes campos, aplique a migration da fase 4.3 em
        homologação.
      </p>
      <details open>
        <summary>Identidade</summary>
        <div className="import-field-grid">
          {textField("subtitle", "Subtítulo da marca")}
          <label>
            Logotipo local
            <input
              className="import-input"
              placeholder="/templates/clinics/empresa/logo.png"
              value={d.logo ?? ""}
              onChange={(e) => onChange({ ...d, logo: e.target.value || null })}
            />
          </label>
          {(
            [
              ["primary", "Cor principal"],
              ["button", "Cor dos botões"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              <select
                value={d[key] ?? "#004D50"}
                onChange={(e) => onChange({ ...d, [key]: e.target.value })}
              >
                <option value="#004D50">Azul-petróleo</option>
                <option value="#244c45">Verde profundo</option>
                <option value="#414b64">Azul ardósia</option>
              </select>
            </label>
          ))}
          <label>
            Cor secundária
            <select
              value={d.secondary ?? "#B8DDD6"}
              onChange={(e) =>
                onChange({
                  ...d,
                  secondary: e.target.value as AppointmentsDesign["secondary"],
                })
              }
            >
              <option value="#B8DDD6">Verde-água</option>
              <option value="#dce8d8">Sálvia</option>
              <option value="#dce2ef">Azul claro</option>
            </select>
          </label>
          {textField("footerDescription", "Descrição do rodapé", true)}
        </div>
        <small>
          O nome comercial, telefone, WhatsApp, Instagram e endereço são
          editados nos dados confirmados acima.
        </small>
      </details>
      <details>
        <summary>Hero</summary>
        <div className="import-field-grid">
          {textField(
            "heroTitle",
            "Título principal (vazio usa o título-base existente)",
          )}
          {textField("heroDescription", "Descrição principal", true)}
          {textField("cta", "CTA principal")}
          {textField("secondaryCta", "CTA para conhecer a clínica")}
        </div>
        {photoFields(
          d.heroImage,
          "Fotografia do hero",
          (heroImage) => onChange({ ...d, heroImage }),
          defaultPhoto("doctor-consultation-main"),
        )}
      </details>
      <details>
        <summary>Especialidades e serviços confirmados</summary>
        <div className="import-field-grid">
          {textField("servicesTitle", "Título da seção")}
          {textField("servicesDescription", "Introdução", true)}
          {textField("servicesCta", "CTA dos cards")}
        </div>
        <p>
          A ordem abaixo determina a ordem dos cards. Os seis primeiros ficam
          abertos inicialmente.
        </p>
        {services.map((service, i) => (
          <div className="generation-summary" key={`${service}-${i}`}>
            <label>
              Serviço confirmado {i + 1}
              <input
                className="import-input"
                defaultValue={service}
                onBlur={(e) => {
                  e.target.value = e.target.value.trim();
                  onServicesChange(
                    services.map((s, j) => (j === i ? e.target.value : s)),
                  );
                  if (
                    e.target.value &&
                    d.serviceDescriptions?.[service] !== undefined
                  )
                    onChange({
                      ...d,
                      serviceDescriptions: {
                        ...d.serviceDescriptions,
                        [e.target.value]: d.serviceDescriptions[service],
                      },
                    });
                }}
              />
            </label>
            <label>
              Descrição
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
            <div className="import-actions">
              <button
                className="button"
                type="button"
                disabled={i === 0}
                onClick={() => onServicesChange(move(services, i, -1))}
              >
                Subir
              </button>
              <button
                className="button"
                type="button"
                disabled={i === services.length - 1}
                onClick={() => onServicesChange(move(services, i, 1))}
              >
                Descer
              </button>
              <button
                className="button"
                type="button"
                onClick={() =>
                  onServicesChange(services.filter((_, j) => j !== i))
                }
              >
                Remover serviço
              </button>
            </div>
          </div>
        ))}
        <label>
          Novo serviço confirmado
          <input
            className="import-input"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button"
          disabled={
            !newService.trim() ||
            services.length >= 50 ||
            services.includes(newService.trim())
          }
          onClick={() => {
            onServicesChange([...services, newService.trim()]);
            setNewService("");
          }}
        >
          Adicionar serviço confirmado
        </button>
      </details>
      <details>
        <summary>Sobre a clínica</summary>
        <div className="import-field-grid">
          {textField("aboutTitle", "Título Sobre")}
          {textField(
            "aboutDescription",
            "Descrição institucional aprovada",
            true,
          )}
          {textField("aboutCta", "CTA Sobre")}
        </div>
        {photoFields(
          d.aboutImage,
          "Fotografia Sobre",
          (aboutImage) => onChange({ ...d, aboutImage }),
          defaultPhoto("clinic-reception-hero"),
        )}
      </details>
      <details>
        <summary>Como funciona</summary>
        <div className="import-field-grid">
          {textField("processTitle", "Título das etapas")}
          {textField("processDescription", "Orientação introdutória", true)}
        </div>
        {(d.steps ?? appointmentSteps).map((step, i) => (
          <div className="generation-summary" key={i}>
            <strong>Etapa 0{i + 1}</strong>
            <label>
              Título
              <input
                className="import-input"
                value={step.title}
                onChange={(e) =>
                  onChange({
                    ...d,
                    steps: (d.steps ?? appointmentSteps).map((s, j) =>
                      j === i ? { ...s, title: e.target.value } : s,
                    ),
                  })
                }
              />
            </label>
            <label>
              Orientação
              <textarea
                value={step.description}
                onChange={(e) =>
                  onChange({
                    ...d,
                    steps: (d.steps ?? appointmentSteps).map((s, j) =>
                      j === i ? { ...s, description: e.target.value } : s,
                    ),
                  })
                }
              />
            </label>
          </div>
        ))}
        <label>
          Canal preferido
          <select
            value={d.contactChannel ?? "auto"}
            onChange={(e) =>
              onChange({
                ...d,
                contactChannel: e.target
                  .value as AppointmentsDesign["contactChannel"],
              })
            }
          >
            {[
              ["auto", "Automático (prioriza WhatsApp)"],
              ["whatsapp", "WhatsApp"],
              ["phone", "Telefone"],
              ["email", "E-mail"],
              ["instagram", "Instagram"],
              ["website", "Site informado"],
            ].map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <small>
          Se o canal escolhido estiver ausente ou oculto, usa outro canal
          válido. Não há agendamento online nesta demonstração.
        </small>
      </details>
      <details>
        <summary>Galeria e imagens</summary>
        <div className="import-field-grid">
          {textField("structureTitle", "Título da galeria")}
          {textField("structureDescription", "Descrição da galeria", true)}
        </div>
        {gallery.map((photo, i) => (
          <div key={i}>
            {photoFields(
              photo,
              `Imagem ${i + 1}`,
              (next) =>
                onChange({
                  ...d,
                  gallery: gallery.map((p, j) =>
                    j === i
                      ? (next ??
                        defaultPhoto(
                          [
                            "clinic-reception-hero",
                            "clinic-room-structure",
                            "consultation-detail",
                          ][i],
                        ))
                      : p,
                  ),
                }),
              defaultPhoto(
                [
                  "clinic-reception-hero",
                  "clinic-room-structure",
                  "consultation-detail",
                ][i],
              ),
            )}
            <div className="import-actions">
              <button
                type="button"
                className="button"
                disabled={i === 0}
                onClick={() =>
                  onChange({ ...d, gallery: move(gallery, i, -1) })
                }
              >
                Mover imagem para antes
              </button>
              <button
                type="button"
                className="button"
                disabled={i === gallery.length - 1}
                onClick={() => onChange({ ...d, gallery: move(gallery, i, 1) })}
              >
                Mover imagem para depois
              </button>
            </div>
          </div>
        ))}
      </details>
      <button
        type="button"
        className="button"
        onClick={() => onChange({ ...d, gallery: undefined })}
      >
        Restaurar seleção de fotos padrão compatíveis
      </button>
      <details>
        <summary>Contato e faixa de conversão</summary>
        <div className="import-field-grid">
          {textField("conversionTitle", "Título da faixa")}
          {textField("conversionDescription", "Descrição da faixa", true)}
          {textField("conversionCta", "CTA da faixa")}
          {textField("contactTitle", "Título Contato")}
          {textField("contactDescription", "Descrição Contato", true)}
          <label>
            E-mail confirmado
            <input
              className="import-input"
              type="email"
              value={d.email ?? ""}
              onChange={(e) =>
                onChange({ ...d, email: e.target.value || null })
              }
            />
          </label>
          {textField("hours", "Horários confirmados", true)}
        </div>
        <p>
          Ocultar campos de contato (campos ausentes nunca são preenchidos
          automaticamente):
        </p>
        {appointmentContactIds.map((id) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={d.hiddenContacts?.includes(id) ?? false}
              onChange={(e) =>
                onChange({
                  ...d,
                  hiddenContacts: e.target.checked
                    ? [...(d.hiddenContacts ?? []), id]
                    : d.hiddenContacts?.filter((c) => c !== id),
                })
              }
            />
            {
              {
                address: "Localização",
                phone: "Telefone",
                whatsapp: "WhatsApp",
                email: "E-mail",
                hours: "Horários",
                instagram: "Instagram",
                website: "Site informado",
              }[id]
            }
          </label>
        ))}
      </details>
      <details>
        <summary>Ordem e visibilidade das seções</summary>
        {appointmentSectionIds.map((id) => (
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
            {sectionLabels[id]}
          </label>
        ))}
        {sections.map((id, i) => (
          <div className="import-actions" key={id}>
            <span>
              {i + 1}. {sectionLabels[id]}
            </span>
            <button
              className="button"
              type="button"
              disabled={i === 0}
              onClick={() =>
                onChange({ ...d, sections: move(sections, i, -1) })
              }
            >
              Subir
            </button>
            <button
              className="button"
              type="button"
              disabled={i === sections.length - 1}
              onClick={() => onChange({ ...d, sections: move(sections, i, 1) })}
            >
              Descer
            </button>
          </div>
        ))}
      </details>
      <button
        type="button"
        className="button"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar as opções do Template B? Dados confirmados e personalizações do Template A serão preservados.",
            )
          )
            onChange(undefined);
        }}
      >
        Restaurar padrões do Template B
      </button>
    </details>
  );
}
