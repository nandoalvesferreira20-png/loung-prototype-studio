"use client";
import { RestaurantDigitalControls } from "./restaurant-digital-controls";
import {
  restaurantColors,
  restaurantCopy,
  restaurantCopyLabels,
  restaurantSectionLabels,
  restaurantSections,
  type RestaurantDesign,
  type RestaurantPhoto,
  type RestaurantItem,
} from "@/lib/generation/restaurant-design";
import {
  restaurantPhotos,
  restaurantGallery,
} from "@/templates/restaurants/premium/photography";

function move<T>(items: readonly T[], i: number, delta: number) {
  const result = [...items];
  const to = i + delta;
  if (to < 0 || to >= items.length) return result;
  [result[i], result[to]] = [result[to], result[i]];
  return result;
}
function PhotoControls({
  label,
  value,
  onChange,
}: {
  label: string;
  value: RestaurantPhoto;
  onChange: (p: RestaurantPhoto) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <label>
        Fotografia local autorizada
        <input
          value={value.src ?? ""}
          placeholder="/templates/restaurants/...png"
          onChange={(e) => onChange({ ...value, src: e.target.value || null })}
        />
      </label>
      <label>
        Referência compartilhada
        <select
          value={
            Object.values(restaurantPhotos).some((p) => p.src === value.src)
              ? (value.src ?? "")
              : ""
          }
          onChange={(e) => {
            if (e.target.value)
              onChange({ ...value, src: e.target.value, demonstration: true });
          }}
        >
          <option value="">Selecionar referência ilustrativa</option>
          {Object.entries(restaurantPhotos).map(([key, p]) => (
            <option key={key} value={p.src}>
              {p.alt}
            </option>
          ))}
        </select>
      </label>
      <label>
        Texto alternativo
        <input
          maxLength={300}
          value={value.alt ?? ""}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
        />
      </label>
      <label>
        Legenda
        <input
          maxLength={160}
          value={value.caption ?? ""}
          onChange={(e) => onChange({ ...value, caption: e.target.value })}
        />
      </label>
      <label>
        Enquadramento
        <select
          value={value.position ?? "center"}
          onChange={(e) =>
            onChange({
              ...value,
              position: e.target.value as RestaurantPhoto["position"],
            })
          }
        >
          {["center", "left", "right", "top", "bottom"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={value.demonstration}
          onChange={(e) =>
            onChange({ ...value, demonstration: e.target.checked })
          }
        />
        Referência ilustrativa (desmarque somente para foto própria autorizada;
        assets compartilhados mantêm identificação)
      </label>
      <button type="button" onClick={() => onChange({ ...value, src: null })}>
        Remover fotografia
      </button>
    </fieldset>
  );
}
export function RestaurantControls({
  value,
  onChange,
  variant = "A",
}: {
  value: RestaurantDesign | undefined;
  onChange: (d: RestaurantDesign | undefined) => void;
  variant?: "A" | "B";
}) {
  const d = value ?? { version: 1 };
  const patch = (p: Partial<RestaurantDesign>) => onChange({ ...d, ...p });
  const items = [...(d.items ?? [])].sort((a, b) => a.order - b.order);
  const categories = [...(d.categories ?? [])].sort(
    (a, b) => a.order - b.order,
  );
  const gallery = d.gallery ?? restaurantGallery;
  const sections = d.sections ?? [...restaurantSections];
  const editItem = (id: string, p: Partial<RestaurantItem>) =>
    patch({
      items: items.map((item) => (item.id === id ? { ...item, ...p } : item)),
    });
  const reorderItems = (i: number, delta: number) =>
    patch({
      items: move(items, i, delta).map((v, order) => ({ ...v, order })),
    });
  return (
    <section className="design-editor">
      <h3>
        {variant === "B"
          ? "Cardápio Digital e Pedidos — Restaurantes B"
          : "Gastronômico Premium — Restaurantes A"}
      </h3>
      <p>
        Cadastre somente produtos, preços e informações confirmados. Nenhum
        produto é criado automaticamente. Até 60 produtos, 16 categorias, 12
        fotos na galeria e 250 KB de personalização. Fotos devem existir em
        public/templates/restaurants/; este editor recebe caminhos locais, sem
        serviço de upload.
      </p>
      <details>
        <summary>Identidade, cores e informações confirmadas</summary>
        <div className="form-grid">
          <label>
            Segmento confirmado
            <select
              value={d.segment ?? "restaurant"}
              onChange={(e) =>
                patch({
                  segment: e.target.value as RestaurantDesign["segment"],
                })
              }
            >
              {Object.entries({
                restaurant: "Restaurante",
                pizzeria: "Pizzaria",
                burger: "Hamburgueria",
                japanese: "Restaurante japonês",
                bistro: "Bistrô",
                cafe: "Cafeteria",
                other: "Outro",
              }).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Subtítulo (vazio oculta)
            <input
              value={d.subtitle ?? "Restaurante"}
              maxLength={160}
              onChange={(e) => patch({ subtitle: e.target.value })}
            />
          </label>
          <label>
            Logo local
            <input
              value={d.logo ?? ""}
              onChange={(e) => patch({ logo: e.target.value || null })}
            />
          </label>
          <label style={variant === "B" ? { display: "none" } : undefined}>
            Símbolo
            <select
              value={d.symbol ?? "botanical"}
              onChange={(e) =>
                patch({ symbol: e.target.value as RestaurantDesign["symbol"] })
              }
            >
              <option value="botanical">Botânico</option>
              <option value="monogram">Monograma</option>
              <option value="none">Sem símbolo</option>
            </select>
          </label>
          <label style={variant === "B" ? { display: "none" } : undefined}>
            Tipografia
            <select
              value={d.typeface ?? "editorial"}
              onChange={(e) =>
                patch({
                  typeface: e.target.value as RestaurantDesign["typeface"],
                })
              }
            >
              <option value="editorial">Editorial</option>
              <option value="classic">Clássica</option>
            </select>
          </label>
          {Object.entries(restaurantColors).map(([key, color]) => (
            <label
              key={key}
              style={variant === "B" ? { display: "none" } : undefined}
            >
              {key}
              <input
                type="color"
                value={
                  d.colors?.[key as keyof typeof restaurantColors] ?? color
                }
                onChange={(e) =>
                  patch({ colors: { ...d.colors, [key]: e.target.value } })
                }
              />
            </label>
          ))}
          <label>
            E-mail confirmado
            <input
              type="email"
              value={d.email ?? ""}
              onChange={(e) => patch({ email: e.target.value || null })}
            />
          </label>
          <label>
            Horários confirmados
            <textarea
              value={d.openingHours ?? ""}
              maxLength={1000}
              onChange={(e) => patch({ openingHours: e.target.value })}
            />
          </label>
        </div>
        <p>
          Nome, cidade, estado, endereço, telefone, WhatsApp e Instagram usam os
          dados confirmados acima. Não deduza horários, salão, serviço de mesa
          ou reservas. Oculte as seções incompatíveis com o estabelecimento.
        </p>
      </details>
      {variant === "B" && (
        <RestaurantDigitalControls
          value={d.digital}
          categories={categories}
          onChange={(digital) => patch({ digital })}
          renderPhoto={(props) => <PhotoControls {...props} />}
        />
      )}
      <details hidden={variant === "B"}>
        <summary>Textos e CTAs</summary>
        <div className="form-grid">
          {(Object.keys(restaurantCopy) as (keyof typeof restaurantCopy)[]).map(
            (key) => (
              <label key={key}>
                {restaurantCopyLabels[key]}
                {key.endsWith("Description") ? (
                  <textarea
                    value={d.copy?.[key] ?? ""}
                    placeholder={restaurantCopy[key]}
                    maxLength={2000}
                    onChange={(e) =>
                      patch({ copy: { ...d.copy, [key]: e.target.value } })
                    }
                  />
                ) : (
                  <input
                    value={d.copy?.[key] ?? ""}
                    placeholder={restaurantCopy[key]}
                    maxLength={key.endsWith("Cta") ? 100 : 255}
                    onChange={(e) =>
                      patch({ copy: { ...d.copy, [key]: e.target.value } })
                    }
                  />
                )}
              </label>
            ),
          )}
        </div>
        <p>
          O CTA do cardápio só aparece com produtos visíveis. Sem cardápio,
          utiliza contato confirmado; sem contato, informações. Não há reservas
          ou pedidos automáticos.
        </p>
      </details>
      <details hidden={variant === "B"}>
        <summary>Fotografias das seções</summary>
        {(
          Object.keys(restaurantPhotos) as (keyof typeof restaurantPhotos)[]
        ).map((slot) => (
          <PhotoControls
            key={slot}
            label={
              {
                hero: "Hero",
                gastronomy: "Gastronomia",
                history: "História / apresentação",
                contact: "Contato",
              }[slot]
            }
            value={d.images?.[slot] ?? restaurantPhotos[slot]}
            onChange={(photo) =>
              patch({ images: { ...d.images, [slot]: photo } })
            }
          />
        ))}
      </details>
      <details hidden={variant === "B"}>
        <summary>Galeria de ambientes ({gallery.length}/12)</summary>
        <p>
          Referências visuais não comprovam instalações reais. Remova imagens
          incompatíveis com o estabelecimento.
        </p>
        {gallery.map((p, index) => (
          <div key={index}>
            <PhotoControls
              label={`Fotografia ${index + 1}`}
              value={p}
              onChange={(photo) =>
                patch({
                  gallery: gallery.map((v, i) => (i === index ? photo : v)),
                })
              }
            />
            <div className="button-row">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => patch({ gallery: move(gallery, index, -1) })}
              >
                Subir foto
              </button>
              <button
                type="button"
                disabled={index === gallery.length - 1}
                onClick={() => patch({ gallery: move(gallery, index, 1) })}
              >
                Descer foto
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({ gallery: gallery.filter((_, i) => i !== index) })
                }
              >
                Excluir da galeria
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          disabled={gallery.length >= 12}
          onClick={() =>
            patch({ gallery: [...gallery, { src: null, demonstration: true }] })
          }
        >
          Adicionar fotografia
        </button>
      </details>
      <details open>
        <summary>Cardápio — categorias ({categories.length}/16)</summary>
        {categories.map((cat, index) => (
          <fieldset key={cat.id}>
            <legend>Categoria {index + 1}</legend>
            <label>
              Nome
              <input
                maxLength={120}
                value={cat.name}
                onChange={(e) =>
                  patch({
                    categories: categories.map((v) =>
                      v.id === cat.id ? { ...v, name: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={cat.hidden}
                onChange={(e) =>
                  patch({
                    categories: categories.map((v) =>
                      v.id === cat.id ? { ...v, hidden: e.target.checked } : v,
                    ),
                  })
                }
              />
              Ocultar categoria e seus produtos
            </label>
            <div className="button-row">
              <button
                type="button"
                disabled={!index}
                onClick={() =>
                  patch({
                    categories: move(categories, index, -1).map((v, order) => ({
                      ...v,
                      order,
                    })),
                  })
                }
              >
                Subir categoria
              </button>
              <button
                type="button"
                disabled={index === categories.length - 1}
                onClick={() =>
                  patch({
                    categories: move(categories, index, 1).map((v, order) => ({
                      ...v,
                      order,
                    })),
                  })
                }
              >
                Descer categoria
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({
                    categories: categories.filter((v) => v.id !== cat.id),
                    digital: d.digital
                      ? {
                          ...d.digital,
                          bannerCategoryId:
                            d.digital.bannerCategoryId === cat.id
                              ? null
                              : d.digital.bannerCategoryId,
                          categoryIcons: d.digital.categoryIcons?.filter(
                            (icon) => icon.categoryId !== cat.id,
                          ),
                        }
                      : undefined,
                    items: items.map((v) =>
                      v.categoryId === cat.id ? { ...v, categoryId: null } : v,
                    ),
                  })
                }
              >
                Excluir categoria (preserva produtos sem categoria)
              </button>
            </div>
          </fieldset>
        ))}
        <button
          type="button"
          disabled={categories.length >= 16}
          onClick={() =>
            patch({
              categories: [
                ...categories,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  hidden: false,
                  order: categories.length,
                },
              ],
            })
          }
        >
          Adicionar categoria
        </button>
      </details>
      <details open>
        <summary>Cardápio — produtos ({items.length}/60)</summary>
        <label style={variant === "B" ? { display: "none" } : undefined}>
          Quantidade inicial de destaques
          <input
            type="number"
            min={1}
            max={24}
            step={1}
            value={d.menuLimit ?? 3}
            onChange={(e) => patch({ menuLimit: e.target.valueAsNumber })}
          />
        </label>
        <p>
          {variant === "B"
            ? "Preços ausentes aparecem como sob consulta. Produtos indisponíveis aparecem identificados e não podem entrar no carrinho. Categorias ocultas não aparecem."
            : "Preços vazios ficam ocultos. Produtos indisponíveis e categorias ocultas não aparecem na prévia."}{" "}
          Destaques aparecem primeiro, respeitando a ordem dentro de cada grupo.
          Para usar fotos compartilhadas em um produto, marque-o explicitamente
          como demonstrativo.
        </p>
        {items.map((item, index) => (
          <details key={item.id} open={!item.name}>
            <summary>
              {index + 1}. {item.name || "Novo produto — informe o nome"}
              {item.demonstration ? " · demonstrativo" : ""}
            </summary>
            <small>ID: {item.id}</small>
            <div className="button-row">
              <button
                type="button"
                disabled={!index}
                onClick={() => reorderItems(index, -1)}
              >
                Subir produto
              </button>
              <button
                type="button"
                disabled={index === items.length - 1}
                onClick={() => reorderItems(index, 1)}
              >
                Descer produto
              </button>
              <button
                type="button"
                onClick={() =>
                  patch({ items: items.filter((v) => v.id !== item.id) })
                }
              >
                Excluir produto
              </button>
            </div>
            <div className="form-grid">
              <label>
                Nome
                <input
                  maxLength={160}
                  value={item.name}
                  onChange={(e) => editItem(item.id, { name: e.target.value })}
                />
              </label>
              <label>
                Descrição
                <textarea
                  maxLength={1000}
                  value={item.description}
                  onChange={(e) =>
                    editItem(item.id, { description: e.target.value })
                  }
                />
              </label>
              <label>
                Categoria
                <select
                  value={item.categoryId ?? ""}
                  onChange={(e) =>
                    editItem(item.id, { categoryId: e.target.value || null })
                  }
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option value={cat.id} key={cat.id}>
                      {cat.name || "Categoria sem nome"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Preço confirmado (R$)
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  step="0.01"
                  value={item.price ?? ""}
                  onChange={(e) =>
                    editItem(item.id, {
                      price:
                        e.target.value === "" ? null : e.target.valueAsNumber,
                    })
                  }
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.available}
                  onChange={(e) =>
                    editItem(item.id, { available: e.target.checked })
                  }
                />
                Disponível
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.featured}
                  onChange={(e) =>
                    editItem(item.id, { featured: e.target.checked })
                  }
                />
                Destaque
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={item.demonstration}
                  onChange={(e) =>
                    editItem(item.id, { demonstration: e.target.checked })
                  }
                />
                Exemplo demonstrativo — não é oferta do restaurante
              </label>
            </div>
            <PhotoControls
              label="Fotografia do produto"
              value={item.image ?? { src: null, demonstration: false }}
              onChange={(image) => editItem(item.id, { image })}
            />
          </details>
        ))}
        <button
          type="button"
          disabled={items.length >= 60}
          onClick={() =>
            patch({
              items: [
                ...items,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  description: "",
                  categoryId: null,
                  price: null,
                  available: true,
                  featured: false,
                  order: items.length,
                  demonstration: false,
                },
              ],
            })
          }
        >
          Adicionar produto
        </button>
      </details>
      <details hidden={variant === "B"}>
        <summary>Ordem e visibilidade das seções</summary>
        {sections.map((section, index) => (
          <div key={section} className="button-row">
            <span>{restaurantSectionLabels[section]}</span>
            <button
              type="button"
              disabled={!index}
              onClick={() => patch({ sections: move(sections, index, -1) })}
            >
              Subir
            </button>
            <button
              type="button"
              disabled={index === sections.length - 1}
              onClick={() => patch({ sections: move(sections, index, 1) })}
            >
              Descer
            </button>
            <button
              type="button"
              onClick={() =>
                patch({ sections: sections.filter((v) => v !== section) })
              }
            >
              Ocultar
            </button>
          </div>
        ))}
        {restaurantSections
          .filter((s) => !sections.includes(s))
          .map((section) => (
            <button
              type="button"
              key={section}
              onClick={() => patch({ sections: [...sections, section] })}
            >
              Mostrar {restaurantSectionLabels[section]}
            </button>
          ))}
      </details>
      <button
        type="button"
        onClick={() => {
          if (
            window.confirm(
              "Restaurar os padrões visuais do restaurante? Produtos, categorias, e-mail e horários serão preservados.",
            )
          )
            onChange(
              variant === "B"
                ? { ...d, digital: undefined }
                : {
                    version: 1,
                    items: d.items,
                    categories: d.categories,
                    email: d.email,
                    openingHours: d.openingHours,
                    segment: d.segment,
                    digital: d.digital,
                  },
            );
        }}
      >
        Restaurar padrões visuais
      </button>
    </section>
  );
}
