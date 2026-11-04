"use client";
import {
  estateColors,
  estateCopyKeys,
  estateSections,
  propertyTypeLabels,
  propertyTypes,
  type RealEstateDesign,
  type EstateProperty,
  type EstatePhoto,
} from "@/lib/generation/real-estate-design";
import { estatePhotos } from "@/templates/real-estate/premium/photography";
import {
  personalColors,
  personalBenefits,
  personalSteps,
  personalSections,
} from "@/templates/real-estate/personal/content";
const sectionLabels = {
  properties: "Catálogo",
  about: "Sobre",
  categories: "Categorias",
  steps: "Etapas",
  services: "Serviços",
  editorial: "Editorial",
  conversion: "Faixa de contato",
  contact: "Contato",
};
const copyLabels: Record<(typeof estateCopyKeys)[number], string> = {
  heroTitle: "Título do hero",
  heroDescription: "Descrição do hero",
  heroPrimaryCta: "CTA principal",
  heroSecondaryCta: "CTA secundário",
  propertiesTitle: "Título do catálogo",
  propertiesDescription: "Descrição do catálogo",
  emptyTitle: "Título sem imóveis",
  emptyDescription: "Texto sem imóveis",
  aboutTitle: "Título sobre",
  aboutDescription: "Texto institucional",
  aboutCta: "CTA sobre",
  categoriesTitle: "Título categorias",
  categoriesDescription: "Texto categorias",
  stepsTitle: "Título das etapas",
  servicesTitle: "Título serviços",
  editorialTitle: "Título editorial",
  editorialDescription: "Texto editorial",
  editorialCta: "CTA editorial",
  conversionTitle: "Título faixa de contato",
  conversionDescription: "Texto faixa de contato",
  conversionCta: "CTA faixa de contato",
  contactTitle: "Título contato",
  contactDescription: "Texto contato",
  contactCta: "CTA contato",
  footerDescription: "Texto do rodapé",
};
function move<T>(items: T[], index: number, delta: number) {
  const next = [...items];
  const target = index + delta;
  if (target < 0 || target >= items.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
function PhotoControls({
  value,
  onChange,
  label,
  real = false,
}: {
  value: EstatePhoto;
  onChange: (v: EstatePhoto) => void;
  label: string;
  real?: boolean;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Caminho local{" "}
        {real
          ? "(foto real autorizada em /templates/real-estate/properties/)"
          : "(imagem ilustrativa)"}
        <input
          value={value.src || ""}
          placeholder="/templates/real-estate/...png"
          onChange={(e) => onChange({ ...value, src: e.target.value || null })}
        />
      </label>
      {!real && (
        <label>
          Imagem compartilhada
          <select
            value={
              Object.values(estatePhotos).some((p) => p.src === value.src)
                ? value.src || ""
                : ""
            }
            onChange={(e) => {
              if (e.target.value) onChange({ ...value, src: e.target.value });
            }}
          >
            <option value="">Escolher imagem ilustrativa</option>
            {Object.entries(estatePhotos).map(([key, p]) => (
              <option key={key} value={p.src!}>
                {p.alt}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Texto alternativo
        <input
          maxLength={300}
          value={value.alt || ""}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
      </label>
      <label>
        Enquadramento
        <select
          value={value.position || "center"}
          onChange={(e) =>
            onChange({
              ...value,
              position: e.target.value as EstatePhoto["position"],
            })
          }
        >
          {["center", "left", "right", "top", "bottom"].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
    </fieldset>
  );
}
export function RealEstateControls({
  value,
  onChange,
  variant = "A",
}: {
  variant?: "A" | "B";
  value: RealEstateDesign | undefined;
  onChange: (v: RealEstateDesign | undefined) => void;
}) {
  const d = value ?? { version: 1 };
  const patch = (next: Partial<RealEstateDesign>) =>
    onChange({ ...d, ...next });
  const properties = d.properties ?? [];
  const personal = d.personal ?? { version: 1 as const };
  const patchPersonal = (
    next: Partial<NonNullable<RealEstateDesign["personal"]>>,
  ) => patch({ personal: { ...personal, ...next } });
  const editProperty = (id: string, next: Partial<EstateProperty>) =>
    patch({
      properties: properties.map((p) => (p.id === id ? { ...p, ...next } : p)),
    });
  const addProperty = (demonstration: boolean) =>
    patch({
      properties: [
        ...properties,
        {
          id: crypto.randomUUID(),
          title: "",
          purpose: "venda",
          type: "casa",
          images: [],
          status: "disponivel",
          featured: false,
          demonstration,
        },
      ],
    });
  return (
    <section className="design-editor">
      <h3>
        {variant === "B"
          ? "Corretor Pessoal — Template B"
          : "Imobiliária Premium — Template A"}
      </h3>
      <p>
        Os anúncios são cadastrados explicitamente. Imagens compartilhadas são
        ilustrativas. Preços e características vazios ficam ocultos; nenhum
        anúncio é criado automaticamente. Até 48 imóveis e 10 fotos por imóvel,
        máximo 400 KB.
      </p>
      {variant === "B" && (
        <details open>
          <summary>Apresentação pessoal e diferenciais</summary>
          <label>
            Nome de apresentação
            <input
              maxLength={255}
              value={personal.name || ""}
              onChange={(e) => patchPersonal({ name: e.target.value })}
            />
          </label>
          <label>
            Destaque do título
            <input
              maxLength={160}
              value={personal.heroHighlight ?? "lugar certo."}
              onChange={(e) => patchPersonal({ heroHighlight: e.target.value })}
            />
          </label>
          <p>
            Não há retratos ilustrativos locais disponíveis. O padrão usa
            ambientes neutros. Para substituir, informe uma fotografia
            autorizada local. Remova o caminho para ocultar a fotografia.
          </p>
          {(["hero", "about"] as const).map((slot) => (
            <div key={slot}>
              <PhotoControls
                label={`Retrato: ${slot}`}
                value={personal.portraits?.[slot] ?? { src: null }}
                onChange={(photo) =>
                  patchPersonal({
                    portraits: {
                      ...personal.portraits,
                      [slot]: {
                        ...photo,
                        demonstration:
                          personal.portraits?.[slot]?.demonstration ?? true,
                      },
                    },
                  })
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={personal.portraits?.[slot]?.demonstration ?? true}
                  onChange={(e) =>
                    patchPersonal({
                      portraits: {
                        ...personal.portraits,
                        [slot]: {
                          ...(personal.portraits?.[slot] ?? { src: null }),
                          demonstration: e.target.checked,
                        },
                      },
                    })
                  }
                />
                Retrato demonstrativo (desmarque somente para foto real
                autorizada)
              </label>
            </div>
          ))}
          {(personal.benefits ?? personalBenefits).map((benefit, index) => (
            <fieldset key={index}>
              <legend>Diferencial {index + 1}</legend>
              <label>
                Título
                <input
                  maxLength={160}
                  value={benefit.title}
                  onChange={(e) =>
                    patchPersonal({
                      benefits: (personal.benefits ?? personalBenefits).map(
                        (b, i) =>
                          i === index ? { ...b, title: e.target.value } : b,
                      ),
                    })
                  }
                />
              </label>
              <label>
                Descrição
                <textarea
                  maxLength={500}
                  value={benefit.description}
                  onChange={(e) =>
                    patchPersonal({
                      benefits: (personal.benefits ?? personalBenefits).map(
                        (b, i) =>
                          i === index
                            ? { ...b, description: e.target.value }
                            : b,
                      ),
                    })
                  }
                />
              </label>
            </fieldset>
          ))}
        </details>
      )}
      <details>
        <summary>Identidade e cores</summary>
        <div className="form-grid">
          <label>
            Tipo de atendimento
            <select
              value={d.leadType || (variant === "B" ? "broker" : "agency")}
              onChange={(e) =>
                patch({
                  leadType: e.target.value as RealEstateDesign["leadType"],
                })
              }
            >
              <option value="agency">Imobiliária / equipe</option>
              <option value="broker">Corretor autônomo</option>
            </select>
          </label>
          <label>
            Complemento da marca
            <input
              maxLength={160}
              value={d.professionalLabel || ""}
              onChange={(e) => patch({ professionalLabel: e.target.value })}
            />
          </label>
          <label>
            CRECI confirmado
            <input
              maxLength={120}
              value={d.creci || ""}
              onChange={(e) => patch({ creci: e.target.value })}
            />
          </label>
          <label>
            Logo local
            <input
              value={d.logo || ""}
              onChange={(e) => patch({ logo: e.target.value || null })}
            />
          </label>
          <label>
            Símbolo
            <select
              value={d.brandMark || "building"}
              onChange={(e) =>
                patch({
                  brandMark: e.target.value as RealEstateDesign["brandMark"],
                })
              }
            >
              <option value="building">Edificação</option>
              <option value="monogram">Monograma</option>
              <option value="none">Sem símbolo</option>
            </select>
          </label>
          <label>
            Monograma
            <input
              maxLength={8}
              value={d.monogram || ""}
              onChange={(e) => patch({ monogram: e.target.value })}
            />
          </label>
          <label>
            Tipografia
            <select
              value={d.typeface || "editorial"}
              onChange={(e) =>
                patch({
                  typeface: e.target.value as RealEstateDesign["typeface"],
                })
              }
            >
              <option value="editorial">Editorial</option>
              <option value="traditional">Tradicional</option>
            </select>
          </label>
          {Object.entries(variant === "B" ? personalColors : estateColors).map(
            ([key, color]) => (
              <label key={key}>
                {key}
                <input
                  type="color"
                  value={d.colors?.[key as keyof typeof estateColors] || color}
                  onChange={(e) =>
                    patch({ colors: { ...d.colors, [key]: e.target.value } })
                  }
                />
              </label>
            ),
          )}
        </div>
        <p>
          Nome comercial, telefone, WhatsApp, endereço, cidade, estado,
          Instagram e serviços usam os campos confirmados acima.
        </p>
        <label>
          E-mail confirmado
          <input
            type="email"
            value={d.email || ""}
            onChange={(e) => patch({ email: e.target.value || null })}
          />
        </label>
        <label>
          Facebook confirmado
          <input
            type="url"
            value={d.facebook || ""}
            onChange={(e) => patch({ facebook: e.target.value || null })}
          />
        </label>
      </details>
      <details>
        <summary>Textos e CTAs</summary>
        <div className="form-grid">
          {estateCopyKeys.map((key) => (
            <label key={key}>
              {copyLabels[key]}
              {key.endsWith("Description") ? (
                <textarea
                  value={d[key] || ""}
                  maxLength={key === "aboutDescription" ? 3000 : 1000}
                  onChange={(e) => patch({ [key]: e.target.value })}
                />
              ) : (
                <input
                  value={d[key] || ""}
                  maxLength={
                    key.endsWith("Cta")
                      ? 100
                      : key.endsWith("Title")
                        ? 255
                        : 1000
                  }
                  onChange={(e) => patch({ [key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
      </details>
      <details>
        <summary>Fotografias institucionais</summary>
        <p>
          Fotografias institucionais são sempre identificadas como ilustrativas
          e não pertencem ao catálogo.
        </p>
        {(Object.keys(estatePhotos) as (keyof typeof estatePhotos)[]).map(
          (slot) => (
            <PhotoControls
              key={slot}
              label={slot}
              value={d.images?.[slot] ?? estatePhotos[slot]}
              onChange={(photo) =>
                patch({ images: { ...d.images, [slot]: photo } })
              }
            />
          ),
        )}
      </details>
      <details open>
        <summary>Catálogo de imóveis ({properties.length}/48)</summary>
        <p>
          Para imóveis reais, cadastre somente dados confirmados e fotos
          autorizadas próprias. O modo demonstração mantém um aviso no card e
          nos detalhes e não oferece negociação do exemplo.
        </p>
        <div className="button-row">
          <button
            type="button"
            className="button"
            disabled={properties.length >= 48}
            onClick={() => addProperty(false)}
          >
            Adicionar imóvel real
          </button>
          <button
            type="button"
            className="button"
            disabled={properties.length >= 48}
            onClick={() => addProperty(true)}
          >
            Adicionar exemplo demonstrativo
          </button>
        </div>
        {!properties.length && (
          <p>
            Nenhum anúncio cadastrado. A página usa uma composição institucional
            sem busca e sem categorias vazias.
          </p>
        )}
        {properties.map((p, index) => (
          <details key={p.id} open={!p.title}>
            <summary>
              {index + 1}. {p.title || "Novo imóvel — informe o título"}{" "}
              {p.demonstration ? "· demonstração" : "· real"}
            </summary>
            <small>ID: {p.id}</small>
            <div className="button-row">
              <button
                type="button"
                disabled={!index}
                onClick={() =>
                  patch({ properties: move(properties, index, -1) })
                }
              >
                Subir
              </button>
              <button
                type="button"
                disabled={index === properties.length - 1}
                onClick={() =>
                  patch({ properties: move(properties, index, 1) })
                }
              >
                Descer
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({
                    properties: properties.filter((item) => item.id !== p.id),
                  })
                }
              >
                Excluir imóvel
              </button>
            </div>
            <label>
              <input
                type="checkbox"
                checked={p.demonstration}
                onChange={(e) =>
                  editProperty(p.id, { demonstration: e.target.checked })
                }
              />{" "}
              Anúncio fictício explicitamente demonstrativo
            </label>
            <label>
              <input
                type="checkbox"
                checked={p.featured}
                onChange={(e) =>
                  editProperty(p.id, { featured: e.target.checked })
                }
              />{" "}
              Destaque
            </label>
            <div className="form-grid">
              <label>
                Título obrigatório
                <input
                  maxLength={160}
                  value={p.title}
                  onChange={(e) =>
                    editProperty(p.id, { title: e.target.value })
                  }
                />
              </label>
              <label>
                Finalidade
                <select
                  value={p.purpose}
                  onChange={(e) =>
                    editProperty(p.id, {
                      purpose: e.target.value as EstateProperty["purpose"],
                    })
                  }
                >
                  <option value="venda">Venda</option>
                  <option value="locacao">Locação mensal</option>
                </select>
              </label>
              <label>
                Tipo
                <select
                  value={p.type}
                  onChange={(e) =>
                    editProperty(p.id, {
                      type: e.target.value as EstateProperty["type"],
                    })
                  }
                >
                  {propertyTypes.map((t) => (
                    <option key={t} value={t}>
                      {propertyTypeLabels[t]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={p.status}
                  onChange={(e) =>
                    editProperty(p.id, {
                      status: e.target.value as EstateProperty["status"],
                    })
                  }
                >
                  {[
                    "disponivel",
                    "reservado",
                    "vendido",
                    "alugado",
                    "inativo",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {(["city", "neighborhood", "address"] as const).map((key) => (
                <label key={key}>
                  {
                    {
                      city: "Cidade",
                      neighborhood: "Bairro",
                      address: "Endereço opcional",
                    }[key]
                  }
                  <input
                    value={p[key] || ""}
                    maxLength={
                      key === "address" ? 500 : key === "city" ? 120 : 160
                    }
                    onChange={(e) =>
                      editProperty(p.id, { [key]: e.target.value || null })
                    }
                  />
                </label>
              ))}
              {(
                ["price", "area", "bedrooms", "bathrooms", "parking"] as const
              ).map((key) => (
                <label key={key}>
                  {
                    {
                      price: "Preço em R$ (vazio = oculto)",
                      area: "Área em m²",
                      bedrooms: "Quartos",
                      bathrooms: "Banheiros",
                      parking: "Vagas",
                    }[key]
                  }
                  <input
                    type="number"
                    min={key === "area" ? 0.01 : 0}
                    step={key === "price" || key === "area" ? "0.01" : "1"}
                    value={p[key] ?? ""}
                    onChange={(e) =>
                      editProperty(p.id, {
                        [key]:
                          e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label>
              Descrição
              <textarea
                maxLength={3000}
                value={p.description || ""}
                onChange={(e) =>
                  editProperty(p.id, { description: e.target.value })
                }
              />
            </label>
            <label>
              Informações adicionais confirmadas
              <textarea
                maxLength={1000}
                value={p.additional || ""}
                onChange={(e) =>
                  editProperty(p.id, { additional: e.target.value })
                }
              />
            </label>
            {p.images.map((photo, i) => (
              <div key={i}>
                <PhotoControls
                  label={`Foto ${i + 1}`}
                  value={photo}
                  real={!p.demonstration}
                  onChange={(photo) =>
                    editProperty(p.id, {
                      images: p.images.map((v, j) => (j === i ? photo : v)),
                    })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    editProperty(p.id, { images: move(p.images, i, -1) })
                  }
                  disabled={!i}
                >
                  Mover foto para antes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editProperty(p.id, {
                      images: p.images.filter((_, j) => i !== j),
                    })
                  }
                >
                  Remover foto
                </button>
              </div>
            ))}
            <button
              type="button"
              disabled={p.images.length >= 10}
              onClick={() =>
                editProperty(p.id, { images: [...p.images, { src: null }] })
              }
            >
              Adicionar foto local autorizada
            </button>
          </details>
        ))}
      </details>
      <details>
        <summary>Categorias e etapas</summary>
        <p>
          Categorias só aparecem quando possuem imóveis visíveis no catálogo.
          Imagens personalizadas de categoria recebem identificação ilustrativa.
        </p>
        {propertyTypes.map((type) => {
          const category = d.categories?.find((v) => v.type === type) ?? {
            type,
          };
          const change = (next: typeof category) =>
            patch({
              categories: [
                ...(d.categories ?? []).filter((v) => v.type !== type),
                next,
              ],
            });
          return (
            <fieldset key={type}>
              <legend>{propertyTypeLabels[type]}</legend>
              <label>
                <input
                  type="checkbox"
                  checked={!!category.hidden}
                  onChange={(e) =>
                    change({ ...category, hidden: e.target.checked })
                  }
                />
                Ocultar categoria
              </label>
              <PhotoControls
                label="Imagem opcional da categoria"
                value={category.image ?? { src: null }}
                onChange={(image) => change({ ...category, image })}
              />
              <button
                type="button"
                onClick={() => change({ ...category, image: undefined })}
              >
                Usar fotografia do catálogo
              </button>
            </fieldset>
          );
        })}
        <p>
          Textos demonstrativos: não afirme serviços ou disponibilidade sem
          confirmação.
        </p>
        {(
          d.steps ??
          (variant === "B"
            ? personalSteps
            : [
                {
                  title: "Descubra oportunidades.",
                  description:
                    "Explore as informações e os imóveis cadastrados.",
                },
                {
                  title: "Consulte sobre visitas.",
                  description:
                    "Converse sobre as possibilidades de conhecer um imóvel.",
                },
                {
                  title: "Converse com um profissional.",
                  description:
                    "Compartilhe suas dúvidas pelos canais disponíveis.",
                },
              ])
        ).map((step, i, steps) => (
          <fieldset key={i}>
            <legend>Etapa {i + 1}</legend>
            <label>
              Título
              <input
                maxLength={160}
                value={step.title}
                onChange={(e) =>
                  patch({
                    steps: steps.map((v, j) =>
                      i === j ? { ...v, title: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              Descrição
              <textarea
                maxLength={500}
                value={step.description}
                onChange={(e) =>
                  patch({
                    steps: steps.map((v, j) =>
                      i === j ? { ...v, description: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          </fieldset>
        ))}
      </details>
      <details>
        <summary>Ordem e visibilidade das seções</summary>
        {(
          d.sections ??
          (variant === "B" ? [...personalSections] : estateSections)
        ).map((s, i, sections) => (
          <div className="button-row" key={s}>
            <span>{sectionLabels[s]}</span>
            <button
              type="button"
              disabled={!i}
              onClick={() => patch({ sections: move([...sections], i, -1) })}
            >
              Subir
            </button>
            <button
              type="button"
              disabled={i === sections.length - 1}
              onClick={() => patch({ sections: move([...sections], i, 1) })}
            >
              Descer
            </button>
            <button
              type="button"
              onClick={() =>
                patch({ sections: sections.filter((v) => v !== s) })
              }
            >
              Ocultar
            </button>
          </div>
        ))}
        {estateSections
          .filter(
            (s) =>
              !(
                d.sections ??
                (variant === "B" ? [...personalSections] : estateSections)
              ).includes(s),
          )
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                patch({
                  sections: [
                    ...(d.sections ??
                      (variant === "B"
                        ? [...personalSections]
                        : estateSections)),
                    s,
                  ],
                })
              }
            >
              Mostrar {sectionLabels[s]}
            </button>
          ))}
      </details>
      <button
        type="button"
        className="button"
        onClick={() => {
          if (
            window.confirm(
              `Restaurar os padrões visuais do Template ${variant}? O catálogo e os contatos confirmados serão preservados.`,
            )
          )
            onChange({ version: 1, properties: d.properties });
        }}
      >
        Restaurar padrões visuais
      </button>
    </section>
  );
}
