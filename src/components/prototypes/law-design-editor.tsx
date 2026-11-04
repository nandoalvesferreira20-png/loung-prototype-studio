"use client";
import { useState } from "react";
import {
  lawDefaultColors,
  lawIcons,
  lawSections,
  type LawDesign,
  type LawPhoto,
  type LawSection,
  type LawTeamMember,
} from "@/lib/generation/law-design";
import {
  lawPhotos,
  isBrandedReception,
} from "@/templates/law/classic/photography";
const sectionLabels: Record<LawSection, string> = {
  about: "Institucional",
  areas: "Áreas de atuação",
  editorial: "Seção editorial",
  team: "Equipe autorizada",
  contact: "Contato",
};
const iconLabels = {
  scale: "Balança",
  building: "Edifício",
  briefcase: "Pasta",
  home: "Imóvel",
  users: "Pessoas",
  file: "Documento",
  handshake: "Aperto de mãos",
  book: "Livro",
};
export function LawDesignEditor({
  value,
  onChange,
  areas,
  onAreasChange,
}: {
  value: LawDesign | undefined;
  onChange: (next: LawDesign | undefined) => void;
  areas: string[];
  onAreasChange: (next: string[]) => void;
}) {
  const d = value ?? { version: 1 };
  const [newArea, setNewArea] = useState("");
  const features = d.features ?? [
    {
      title: "Conheça a apresentação",
      icon: "handshake" as const,
      target: "about" as const,
    },
    {
      title: areas.length ? "Áreas de atuação" : "Informações institucionais",
      icon: "users" as const,
      target: areas.length ? ("areas" as const) : ("about" as const),
    },
    {
      title: "Informações de contato",
      icon: "scale" as const,
      target: "contact" as const,
    },
  ];
  const sections = d.sections ?? [...lawSections];
  const move = <T,>(items: T[], i: number, delta: number) => {
    const next = [...items];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    return next;
  };
  const field = (key: keyof LawDesign, label: string, multiline = false) => (
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
  const picture = (slot: keyof typeof lawPhotos) => {
    const photo = d.images?.[slot] ?? lawPhotos[slot];
    const update = (next: LawPhoto | undefined) =>
      onChange({ ...d, images: { ...d.images, [slot]: next } });
    return (
      <fieldset className="generation-summary" key={slot}>
        <legend>
          {
            {
              hero: "Hero",
              about: "Institucional",
              editorial: "Editorial",
              contact: "Atendimento e contato",
            }[slot]
          }
        </legend>
        <label>
          Fotografia
          <select
            value={photo.src ?? "none"}
            onChange={(e) =>
              update({
                ...photo,
                src: e.target.value === "none" ? null : e.target.value,
                illustrative: true,
              })
            }
          >
            <option value="none">Sem fotografia</option>
            {Object.values(lawPhotos).map((p) => (
              <option key={p.src} value={p.src!}>
                {p.caption}
              </option>
            ))}
            {photo.src &&
              !Object.values(lawPhotos).some((p) => p.src === photo.src) && (
                <option value={photo.src}>{photo.src}</option>
              )}
          </select>
        </label>
        <label>
          Ou caminho de arquivo local
          <input
            className="import-input"
            placeholder="/templates/law/escritorio/foto.webp"
            value={photo.src ?? ""}
            onChange={(e) =>
              update({
                ...photo,
                src: e.target.value || null,
                illustrative: true,
              })
            }
          />
        </label>
        <label>
          Enquadramento
          <select
            disabled={isBrandedReception(photo.src)}
            value={
              isBrandedReception(photo.src)
                ? "right"
                : (photo.position ?? "center")
            }
            onChange={(e) =>
              update({
                ...photo,
                position: e.target.value as LawPhoto["position"],
              })
            }
          >
            {[
              ["center", "Centro"],
              ["left", "Esquerda"],
              ["right", "Direita"],
              ["top", "Topo"],
              ["bottom", "Base"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {isBrandedReception(photo.src) && (
          <small>
            Recorte seguro obrigatório: somente a porção direita, sem o nome
            fictício incorporado à foto.
          </small>
        )}
        <label>
          Legenda
          <input
            className="import-input"
            value={photo.caption ?? ""}
            onChange={(e) => update({ ...photo, caption: e.target.value })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={photo.illustrative !== false}
            disabled={photo.src
              ?.toLowerCase()
              .startsWith("/templates/law/shared/")}
            onChange={(e) =>
              update({ ...photo, illustrative: e.target.checked })
            }
          />
          Imagem ilustrativa. Desmarque apenas para imagem real autorizada, fora
          do pacote compartilhado.
        </label>
        <button
          type="button"
          className="button"
          onClick={() => update(undefined)}
        >
          Restaurar fotografia padrão
        </button>
      </fieldset>
    );
  };
  const updatePerson = (i: number, next: LawTeamMember) =>
    onChange({ ...d, team: d.team?.map((p, j) => (j === i ? next : p)) });
  return (
    <details className="generation-summary" open>
      <summary>Advocacia A · Clássico e Sofisticado</summary>
      <p>
        Personalização do protótipo jurídico. Informe apenas dados confirmados,
        profissionais reais e fotografias autorizadas. Estes campos exigem a
        migration da fase 4.4 para salvar no Supabase.
      </p>
      <details open>
        <summary>Identidade</summary>
        <p>
          O nome comercial e os canais principais são editados nos dados
          confirmados acima.
        </p>
        <div className="import-field-grid">
          <label>
            Tipo de apresentação
            <select
              value={d.leadType ?? "office"}
              onChange={(e) =>
                onChange({
                  ...d,
                  leadType: e.target.value as LawDesign["leadType"],
                })
              }
            >
              <option value="office">Escritório / sociedade</option>
              <option value="solo">Profissional autônomo</option>
            </select>
          </label>
          {field("monogram", "Monograma (vazio gera iniciais tipográficas)")}
          {field("professionalLabel", "Identificação profissional confirmada")}
          <label>
            Logotipo autorizado local
            <input
              className="import-input"
              value={d.logo ?? ""}
              placeholder="/templates/law/escritorio/logo.png"
              onChange={(e) => onChange({ ...d, logo: e.target.value || null })}
            />
          </label>
          <label>
            Tipografia de títulos
            <select
              value={d.typeface ?? "editorial"}
              onChange={(e) =>
                onChange({
                  ...d,
                  typeface: e.target.value as LawDesign["typeface"],
                })
              }
            >
              <option value="editorial">Editorial · Georgia local</option>
              <option value="traditional">Clássica · Palatino local</option>
            </select>
          </label>
          {(
            Object.keys(lawDefaultColors) as (keyof typeof lawDefaultColors)[]
          ).map((key) => (
            <label key={key}>
              {
                {
                  primary: "Carvão principal",
                  secondary: "Grafite secundário",
                  paper: "Fundo marfim",
                  accent: "Destaque",
                  text: "Texto principal",
                  muted: "Texto secundário",
                }[key]
              }
              <input
                type="color"
                value={d.colors?.[key] ?? lawDefaultColors[key]}
                onChange={(e) =>
                  onChange({
                    ...d,
                    colors: { ...d.colors, [key]: e.target.value },
                  })
                }
              />
            </label>
          ))}
        </div>
      </details>
      <details>
        <summary>Hero</summary>
        <div className="import-field-grid">
          {field("heroTitle", "Título editorial (vazio usa o título-base)")}
          {field("heroDescription", "Descrição do hero", true)}
          {field("heroPrimaryCta", "Botão principal")}
          {field("heroSecondaryCta", "Botão de áreas de atuação")}
        </div>
        {picture("hero")}
      </details>
      <details>
        <summary>Institucional e faixa de destaques</summary>
        <div className="import-field-grid">
          {field("aboutTitle", "Título institucional")}
          {field("aboutDescription", "Descrição institucional aprovada", true)}
          {field("aboutCta", "CTA institucional")}
          {field("footerDescription", "Descrição do rodapé", true)}
        </div>
        <label>
          <input
            type="checkbox"
            checked={d.showFeatures !== false}
            onChange={(e) => onChange({ ...d, showFeatures: e.target.checked })}
          />
          Exibir a faixa institucional
        </label>
        <p>
          Os itens padrão são atalhos neutros. Para editar, informe apenas
          conceitos aprovados para esta apresentação.
        </p>
        {features.map((f, i) => (
          <div className="generation-summary" key={i}>
            <label>
              Item {i + 1}
              <input
                className="import-input"
                value={f.title}
                onChange={(e) =>
                  onChange({
                    ...d,
                    features: features.map((v, j) =>
                      j === i ? { ...v, title: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              Ícone
              <select
                value={f.icon}
                onChange={(e) =>
                  onChange({
                    ...d,
                    features: features.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            icon: e.target.value as (typeof lawIcons)[number],
                          }
                        : v,
                    ),
                  })
                }
              >
                {lawIcons.map((icon) => (
                  <option key={icon} value={icon}>
                    {iconLabels[icon]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Destino
              <select
                value={f.target}
                onChange={(e) =>
                  onChange({
                    ...d,
                    features: features.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            target: e.target.value as
                              "about" | "areas" | "contact",
                          }
                        : v,
                    ),
                  })
                }
              >
                <option value="about">Institucional</option>
                <option value="areas">Áreas de atuação</option>
                <option value="contact">Contato</option>
              </select>
            </label>
          </div>
        ))}
        {picture("about")}
      </details>
      <details>
        <summary>Áreas de atuação confirmadas</summary>
        <div className="import-field-grid">
          {field("areasTitle", "Título da seção")}
          {field("areasDescription", "Introdução", true)}
          {field("areasCta", "Texto do link dos cards")}
        </div>
        {areas.map((area, i) => (
          <div className="generation-summary" key={`${area}-${i}`}>
            <label>
              Área confirmada {i + 1}
              <input
                className="import-input"
                defaultValue={area}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  onAreasChange(areas.map((a, j) => (j === i ? name : a)));
                  if (name && d.areaDetails?.[area])
                    onChange({
                      ...d,
                      areaDetails: {
                        ...d.areaDetails,
                        [name]: d.areaDetails[area],
                      },
                    });
                }}
              />
            </label>
            <label>
              Descrição
              <textarea
                value={d.areaDetails?.[area]?.description ?? ""}
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [area]: {
                        ...d.areaDetails?.[area],
                        description: e.target.value,
                      },
                    },
                  })
                }
              />
            </label>
            <label>
              Ícone
              <select
                value={d.areaDetails?.[area]?.icon ?? "scale"}
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [area]: {
                        ...d.areaDetails?.[area],
                        icon: e.target.value as (typeof lawIcons)[number],
                      },
                    },
                  })
                }
              >
                {lawIcons.map((icon) => (
                  <option key={icon} value={icon}>
                    {iconLabels[icon]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={d.areaDetails?.[area]?.hidden ?? false}
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [area]: {
                        ...d.areaDetails?.[area],
                        hidden: e.target.checked,
                      },
                    },
                  })
                }
              />
              Ocultar esta área
            </label>
            <div className="import-actions">
              <button
                type="button"
                className="button"
                disabled={i === 0}
                onClick={() => onAreasChange(move(areas, i, -1))}
              >
                Subir
              </button>
              <button
                type="button"
                className="button"
                disabled={i === areas.length - 1}
                onClick={() => onAreasChange(move(areas, i, 1))}
              >
                Descer
              </button>
              <button
                type="button"
                className="button"
                onClick={() => onAreasChange(areas.filter((_, j) => j !== i))}
              >
                Remover área
              </button>
            </div>
          </div>
        ))}
        <label>
          Nova área confirmada
          <input
            className="import-input"
            value={newArea}
            onChange={(e) => setNewArea(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="button"
          disabled={
            !newArea.trim() ||
            areas.includes(newArea.trim()) ||
            areas.length >= 50
          }
          onClick={() => {
            onAreasChange([...areas, newArea.trim()]);
            setNewArea("");
          }}
        >
          Adicionar área confirmada
        </button>
      </details>
      <details>
        <summary>Seção editorial</summary>
        <div className="import-field-grid">
          {field("editorialTitle", "Título editorial")}
          {field("editorialDescription", "Texto complementar", true)}
        </div>
        {picture("editorial")}
      </details>
      <details>
        <summary>Equipe real e autorizada</summary>
        <p>
          A seção e o item do menu só aparecem com integrantes autorizados. Não
          use retratos gerados para representar profissionais reais. Fotos
          individuais devem estar em /templates/law/team/.
        </p>
        {field("teamTitle", "Título da equipe")}
        {(d.team ?? []).map((person, i) => (
          <div className="generation-summary" key={i}>
            <strong>Profissional {i + 1}</strong>
            {(
              [
                ["name", "Nome real"],
                ["role", "Cargo confirmado"],
                ["area", "Área de atuação"],
                ["registration", "Registro profissional informado"],
                ["description", "Descrição aprovada"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  className="import-input"
                  value={person[key] ?? ""}
                  onChange={(e) =>
                    updatePerson(i, { ...person, [key]: e.target.value })
                  }
                />
              </label>
            ))}
            <label>
              Retrato real autorizado (caminho local)
              <input
                className="import-input"
                value={person.photo ?? ""}
                placeholder="/templates/law/team/pessoa.webp"
                onChange={(e) =>
                  updatePerson(i, {
                    ...person,
                    photo: e.target.value || null,
                    photoAuthorized: undefined,
                  })
                }
              />
            </label>
            {person.photo && (
              <label>
                <input
                  type="checkbox"
                  checked={person.photoAuthorized === true}
                  onChange={(e) =>
                    updatePerson(i, {
                      ...person,
                      photoAuthorized: e.target.checked ? true : undefined,
                    })
                  }
                />
                Confirmo que a fotografia é real e foi autorizada pelo
                profissional.
              </label>
            )}
            <div className="import-actions">
              <button
                type="button"
                className="button"
                disabled={i === 0}
                onClick={() => onChange({ ...d, team: move(d.team!, i, -1) })}
              >
                Subir
              </button>
              <button
                type="button"
                className="button"
                disabled={i === (d.team?.length ?? 0) - 1}
                onClick={() => onChange({ ...d, team: move(d.team!, i, 1) })}
              >
                Descer
              </button>
              <button
                type="button"
                className="button"
                onClick={() =>
                  onChange({ ...d, team: d.team?.filter((_, j) => j !== i) })
                }
              >
                Remover profissional
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="button"
          disabled={(d.team?.length ?? 0) >= 24}
          onClick={() =>
            onChange({
              ...d,
              team: [...(d.team ?? []), { name: "", authorized: true }],
            })
          }
        >
          Adicionar profissional real com autorização de exibição
        </button>
      </details>
      <details>
        <summary>Contato</summary>
        <div className="import-field-grid">
          {field("contactTitle", "Título Contato")}
          {field("contactDescription", "Descrição de contato", true)}
          {field("contactCta", "CTA institucional")}
          <label>
            E-mail confirmado
            <input
              type="email"
              className="import-input"
              value={d.email ?? ""}
              onChange={(e) =>
                onChange({ ...d, email: e.target.value || null })
              }
            />
          </label>
          <label>
            LinkedIn confirmado
            <input
              className="import-input"
              value={d.linkedin ?? ""}
              placeholder="https://www.linkedin.com/company/..."
              onChange={(e) =>
                onChange({ ...d, linkedin: e.target.value || null })
              }
            />
          </label>
        </div>
        {picture("contact")}
      </details>
      <details>
        <summary>Ordem e visibilidade</summary>
        {lawSections.map((id) => (
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
        className="button"
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar somente as opções visuais jurídicas? Dados comerciais e áreas confirmadas serão preservados. A lista de equipe e imagens jurídicas voltará ao padrão vazio/ilustrativo.",
            )
          )
            onChange(undefined);
        }}
      >
        Restaurar padrões de Advocacia A
      </button>
    </details>
  );
}
