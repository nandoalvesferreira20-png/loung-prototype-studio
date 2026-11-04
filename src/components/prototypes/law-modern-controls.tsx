"use client";
import { useState } from "react";
import {
  modernColors,
  modernSections,
  type LawModernDesign,
  type ModernPhoto,
  type ModernSection,
} from "@/lib/generation/law-modern-design";
import { modernPhotos } from "@/templates/law/modern/photography";
import { ModernPhotoFrame } from "@/templates/law/modern/photo";
const labels: Record<ModernSection, string> = {
  manifesto: "Manifesto",
  areas: "Áreas de atuação",
  about: "Escritório",
  team: "Profissionais autorizados",
  conversion: "Faixa institucional",
  contact: "Contato",
};
export function LawModernControls({
  value,
  onChange,
  areas,
  onAreasChange,
}: {
  value: LawModernDesign | undefined;
  onChange: (value: LawModernDesign | undefined) => void;
  areas: string[];
  onAreasChange: (areas: string[]) => void;
}) {
  const d = value ?? { version: 1 };
  const [newArea, setNewArea] = useState("");
  const sections = d.sections ?? [...modernSections];
  const move = <T,>(items: T[], i: number, delta: number) => {
    const next = [...items];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    return next;
  };
  const field = (key: keyof LawModernDesign, label: string, multi = false) => (
    <label key={key}>
      {label}
      {multi ? (
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
  const image = (slot: keyof typeof modernPhotos) => {
    const p = d.images?.[slot] ?? modernPhotos[slot];
    const update = (p: ModernPhoto | undefined) =>
      onChange({ ...d, images: { ...d.images, [slot]: p } });
    return (
      <fieldset key={slot} className="generation-summary">
        <legend>
          {
            {
              hero: "Hero",
              about: "Escritório",
              professionals:
                "Referência demonstrativa de profissionais · apenas no editor",
              contact: "Contato",
            }[slot]
          }
        </legend>
        <label>
          Imagem
          <select
            value={p.src ?? "none"}
            onChange={(e) =>
              update({
                ...p,
                src: e.target.value === "none" ? null : e.target.value,
                illustrative: true,
              })
            }
          >
            <option value="none">Sem imagem</option>
            {Object.values(modernPhotos)
              .filter((v) => v.src)
              .map((v) => (
                <option key={v.src} value={v.src!}>
                  {v.alt}
                </option>
              ))}
            {p.src &&
              !Object.values(modernPhotos).some((v) => v.src === p.src) && (
                <option value={p.src}>{p.src}</option>
              )}
          </select>
        </label>
        <label>
          Arquivo local autorizado
          <input
            className="import-input"
            value={p.src ?? ""}
            placeholder="/templates/law/escritorio/foto.webp"
            onChange={(e) =>
              update({ ...p, src: e.target.value || null, illustrative: true })
            }
          />
        </label>
        <label>
          Texto alternativo
          <input
            className="import-input"
            value={p.alt ?? ""}
            onChange={(e) => update({ ...p, alt: e.target.value })}
          />
        </label>
        <label>
          Legenda
          <input
            className="import-input"
            value={p.caption ?? ""}
            onChange={(e) => update({ ...p, caption: e.target.value })}
          />
        </label>
        <label>
          Enquadramento
          <select
            value={p.position ?? "center"}
            onChange={(e) =>
              update({
                ...p,
                position: e.target.value as ModernPhoto["position"],
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
        <label>
          <input
            type="checkbox"
            checked={p.illustrative !== false}
            disabled={p.src?.toLowerCase().startsWith("/templates/law/modern/")}
            onChange={(e) => update({ ...p, illustrative: e.target.checked })}
          />
          Imagem ilustrativa. Fotos reais autorizadas devem usar outro diretório
          e ser verificadas pelo administrador.
        </label>
        <button
          type="button"
          className="button"
          onClick={() => update(undefined)}
        >
          Restaurar imagem padrão
        </button>
        {slot === "professionals" && (
          <p>
            Este slot não compõe a equipe da página comercial. Não existe
            professionals.png no pacote atual.
          </p>
        )}
        {slot === "professionals" && p.src && (
          <div
            className="lawModern"
            style={{ maxWidth: 500, height: 280, minHeight: 0 }}
          >
            <ModernPhotoFrame photo={p} role="demo" />
          </div>
        )}
      </fieldset>
    );
  };
  return (
    <details className="generation-summary" open>
      <summary>Advocacia B · Moderno e Minimalista</summary>
      <p>
        Controles específicos do B, na mesma gravação versionada do Studio.
        Dados comerciais e áreas confirmadas ficam nos campos acima. As opções
        anteriores do A são preservadas.
      </p>
      <details open>
        <summary>Identidade e aparência</summary>
        <div className="import-field-grid">
          <label>
            Apresentação
            <select
              value={d.leadType ?? "office"}
              onChange={(e) =>
                onChange({
                  ...d,
                  leadType: e.target.value as LawModernDesign["leadType"],
                })
              }
            >
              <option value="office">Escritório / sociedade</option>
              <option value="solo">Profissional autônomo</option>
            </select>
          </label>
          {field("monogram", "Monograma (vazio deriva do nome)")}
          {field("professionalLabel", "Identificação profissional confirmada")}
          <label>
            Logotipo local
            <input
              className="import-input"
              value={d.logo ?? ""}
              onChange={(e) => onChange({ ...d, logo: e.target.value || null })}
            />
          </label>
          <label>
            Marca de apresentação
            <select
              value={d.brandMark ?? "monogram"}
              onChange={(e) =>
                onChange({
                  ...d,
                  brandMark: e.target.value as LawModernDesign["brandMark"],
                })
              }
            >
              <option value="monogram">Monograma tipográfico</option>
              <option value="geometry">Símbolo geométrico demonstrativo</option>
              <option value="none">Somente o nome</option>
            </select>
          </label>
          <label>
            Tipografia
            <select
              value={d.typeface ?? "geometric"}
              onChange={(e) =>
                onChange({
                  ...d,
                  typeface: e.target.value as LawModernDesign["typeface"],
                })
              }
            >
              <option value="geometric">Sans-serif direta · Arial</option>
              <option value="humanist">Sans-serif humanista · Segoe UI</option>
            </select>
          </label>
          {(Object.keys(modernColors) as (keyof typeof modernColors)[]).map(
            (key) => (
              <label key={key}>
                {
                  {
                    primary: "Azul-marinho principal",
                    secondary: "Azul-marinho secundário",
                    accent: "Destaque azul-acinzentado",
                    paper: "Fundo off-white",
                    white: "Branco de superfície",
                    line: "Divisórias",
                    text: "Texto principal",
                  }[key]
                }
                <input
                  type="color"
                  value={d.colors?.[key] ?? modernColors[key]}
                  onChange={(e) =>
                    onChange({
                      ...d,
                      colors: { ...d.colors, [key]: e.target.value },
                    })
                  }
                />
              </label>
            ),
          )}
          {field("footerDescription", "Descrição do rodapé", true)}
        </div>
      </details>
      <details>
        <summary>Hero assimétrico</summary>
        <div className="import-field-grid">
          {field("heroTitle", "Título (vazio usa o título-base existente)")}
          {field("heroDescription", "Descrição", true)}
          {field("heroPrimaryCta", "Texto do botão")}
        </div>
        {image("hero")}
      </details>
      <details>
        <summary>Manifesto</summary>
        <div className="import-field-grid">
          {field("manifestoTitle", "Título")}
          {field(
            "manifestoDescription",
            "Descrição institucional aprovada",
            true,
          )}
        </div>
      </details>
      <details>
        <summary>Áreas confirmadas</summary>
        <div className="import-field-grid">
          {field("areasTitle", "Título da seção")}
          {field("areasDescription", "Introdução", true)}
          {field("areasCta", "Texto dos links")}
        </div>
        <p>
          A numeração acompanha a ordem. Não inclua áreas ou especializações sem
          confirmação.
        </p>
        {areas.map((a, i) => (
          <div className="generation-summary" key={`${a}-${i}`}>
            <label>
              Área {i + 1}
              <input
                className="import-input"
                defaultValue={a}
                onBlur={(e) => {
                  const name = e.target.value.trim();
                  onAreasChange(areas.map((v, j) => (j === i ? name : v)));
                  if (name && d.areaDetails?.[a])
                    onChange({
                      ...d,
                      areaDetails: {
                        ...d.areaDetails,
                        [name]: d.areaDetails[a],
                      },
                    });
                }}
              />
            </label>
            <label>
              Descrição
              <textarea
                value={d.areaDetails?.[a]?.description ?? ""}
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [a]: {
                        ...d.areaDetails?.[a],
                        description: e.target.value,
                      },
                    },
                  })
                }
              />
            </label>
            <label>
              URL de conteúdo confirmado (opcional)
              <input
                className="import-input"
                value={d.areaDetails?.[a]?.href ?? ""}
                placeholder="Vazio utiliza o contato disponível"
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [a]: {
                        ...d.areaDetails?.[a],
                        href: e.target.value || undefined,
                      },
                    },
                  })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={d.areaDetails?.[a]?.hidden ?? false}
                onChange={(e) =>
                  onChange({
                    ...d,
                    areaDetails: {
                      ...d.areaDetails,
                      [a]: { ...d.areaDetails?.[a], hidden: e.target.checked },
                    },
                  })
                }
              />
              Ocultar esta área
            </label>
            <div className="import-actions">
              <button
                className="button"
                type="button"
                disabled={i === 0}
                onClick={() => onAreasChange(move(areas, i, -1))}
              >
                Subir
              </button>
              <button
                className="button"
                type="button"
                disabled={i === areas.length - 1}
                onClick={() => onAreasChange(move(areas, i, 1))}
              >
                Descer
              </button>
              <button
                className="button"
                type="button"
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
          className="button"
          type="button"
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
        <summary>Escritório</summary>
        <div className="import-field-grid">
          {field("aboutTitle", "Título")}
          {field("aboutDescription", "Descrição aprovada", true)}
          {field("aboutCta", "Texto do botão")}
        </div>
        {image("about")}
      </details>
      <details>
        <summary>Profissionais reais e autorizados</summary>
        <p>
          Sem integrantes autorizados, a seção e o link de navegação ficam
          ocultos. Retratos reais devem estar em /templates/law/team/, com
          autorização confirmada.
        </p>
        {field("teamTitle", "Título da seção")}
        {(d.team ?? []).map((p, i) => (
          <div key={i} className="generation-summary">
            {(
              [
                ["name", "Nome real"],
                ["role", "Cargo confirmado"],
                ["area", "Área de atuação"],
                ["registration", "Inscrição profissional fornecida"],
                ["description", "Descrição aprovada"],
                ["profileUrl", "URL do perfil confirmado"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  className="import-input"
                  value={p[key] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...d,
                      team: d.team?.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              [key]:
                                key === "profileUrl"
                                  ? e.target.value || undefined
                                  : e.target.value,
                            }
                          : v,
                      ),
                    })
                  }
                />
              </label>
            ))}
            <label>
              Foto real autorizada
              <input
                className="import-input"
                value={p.photo ?? ""}
                placeholder="/templates/law/team/pessoa.webp"
                onChange={(e) =>
                  onChange({
                    ...d,
                    team: d.team?.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            photo: e.target.value || null,
                            photoAuthorized: undefined,
                          }
                        : v,
                    ),
                  })
                }
              />
            </label>
            {p.photo && (
              <label>
                <input
                  type="checkbox"
                  checked={p.photoAuthorized === true}
                  onChange={(e) =>
                    onChange({
                      ...d,
                      team: d.team?.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              photoAuthorized: e.target.checked
                                ? true
                                : undefined,
                            }
                          : v,
                      ),
                    })
                  }
                />
                Confirmo que a fotografia é real e autorizada pelo profissional.
              </label>
            )}
            <div className="import-actions">
              <button
                className="button"
                type="button"
                disabled={i === 0}
                onClick={() => onChange({ ...d, team: move(d.team!, i, -1) })}
              >
                Subir
              </button>
              <button
                className="button"
                type="button"
                disabled={i === (d.team?.length ?? 0) - 1}
                onClick={() => onChange({ ...d, team: move(d.team!, i, 1) })}
              >
                Descer
              </button>
              <button
                className="button"
                type="button"
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
          className="button"
          type="button"
          disabled={(d.team?.length ?? 0) >= 24}
          onClick={() =>
            onChange({
              ...d,
              team: [...(d.team ?? []), { name: "", authorized: true }],
            })
          }
        >
          Adicionar profissional real com autorização
        </button>
        {image("professionals")}
      </details>
      <details>
        <summary>Faixa institucional</summary>
        <div className="import-field-grid">
          {field("conversionTitle", "Título")}
          {field("conversionDescription", "Descrição", true)}
          {field("conversionCta", "Texto do botão")}
        </div>
      </details>
      <details>
        <summary>Contato</summary>
        <div className="import-field-grid">
          {field("contactTitle", "Título")}
          {field("contactDescription", "Descrição", true)}
          {field("contactCta", "Texto do botão do header")}
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
          <label>
            LinkedIn confirmado
            <input
              className="import-input"
              value={d.linkedin ?? ""}
              onChange={(e) =>
                onChange({ ...d, linkedin: e.target.value || null })
              }
            />
          </label>
        </div>
        <small>
          Telefone, WhatsApp, endereço e Instagram são editados nos dados
          confirmados acima.
        </small>
        {image("contact")}
      </details>
      <details>
        <summary>Ordem e visibilidade</summary>
        {modernSections.map((id) => (
          <label key={id}>
            <input
              type="checkbox"
              checked={sections.includes(id)}
              onChange={(e) =>
                onChange({
                  ...d,
                  sections: e.target.checked
                    ? [...sections, id]
                    : sections.filter((v) => v !== id),
                })
              }
            />
            {labels[id]}
          </label>
        ))}
        {sections.map((id, i) => (
          <div className="import-actions" key={id}>
            <span>
              {i + 1}. {labels[id]}
            </span>
            <button
              type="button"
              className="button"
              disabled={i === 0}
              onClick={() =>
                onChange({ ...d, sections: move(sections, i, -1) })
              }
            >
              Subir
            </button>
            <button
              type="button"
              className="button"
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
              "Restaurar somente a personalização de Advocacia B? A equipe do B voltará ao padrão vazio. Dados confirmados e personalizações dos demais templates serão preservados.",
            )
          )
            onChange(undefined);
        }}
      >
        Restaurar padrões de Advocacia B
      </button>
    </details>
  );
}
