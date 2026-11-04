"use client";
import type { ReactNode } from "react";
import {
  digitalColors,
  digitalCopy,
  digitalIcons,
  digitalSections,
  type RestaurantDigital,
  type RestaurantDesign,
  type RestaurantPhoto,
} from "@/lib/generation/restaurant-design";
import { restaurantPhotos } from "@/templates/restaurants/premium/photography";
const labels: Record<keyof typeof digitalCopy, string> = {
  eyebrow: "Identificação do hero",
  heroTitle: "Título do hero",
  heroHighlight: "Palavra de destaque",
  heroDescription: "Texto do hero",
  heroPrimaryCta: "CTA cardápio",
  heroSecondaryCta: "CTA como pedir",
  categoriesTitle: "Título categorias",
  menuTitle: "Título do cardápio",
  menuDescription: "Descrição do cardápio",
  featuredTitle: "Título de destaques",
  emptyTitle: "Título sem cardápio",
  emptyDescription: "Texto sem cardápio",
  cartTitle: "Título do carrinho",
  checkoutCta: "Botão do WhatsApp",
  whatsappIntroduction: "Mensagem inicial do WhatsApp",
  whatsappConfirmation: "Texto de confirmação do WhatsApp",
  bannerTitle: "Título do banner",
  bannerCta: "CTA do banner",
  stepsTitle: "Título como pedir",
  aboutTitle: "Título sobre",
  aboutDescription: "Texto sobre",
  aboutCta: "CTA sobre",
  contactTitle: "Título contato",
  contactDescription: "Texto contato",
  footerDescription: "Texto rodapé",
};
const sectionLabels = {
  menu: "Cardápio e carrinho",
  banner: "Banner de categoria",
  steps: "Como pedir",
  about: "Sobre",
  contact: "Contato",
};
export function RestaurantDigitalControls({
  value,
  categories,
  onChange,
  renderPhoto,
}: {
  value: RestaurantDigital | undefined;
  categories: RestaurantDesign["categories"];
  onChange: (v: RestaurantDigital | undefined) => void;
  renderPhoto: (props: {
    label: string;
    value: RestaurantPhoto;
    onChange: (p: RestaurantPhoto) => void;
  }) => ReactNode;
}) {
  const b = value ?? { version: 1 };
  const patch = (p: Partial<RestaurantDigital>) => onChange({ ...b, ...p });
  const sections = b.sections ?? [...digitalSections];
  const benefits = b.benefits ?? [
    {
      title: "Cardápio digital",
      description: "Conheça os produtos cadastrados.",
    },
    {
      title: "Escolha seus favoritos",
      description: "Monte sua seleção de produtos.",
    },
    {
      title: "Pedido pelo WhatsApp",
      description: "Consulte valores e disponibilidade.",
    },
    {
      title: "Contato facilitado",
      description: "Converse pelos canais disponíveis.",
    },
  ];
  const steps = b.steps ?? [
    {
      title: "Escolha seus favoritos.",
      description: "Navegue pelo cardápio e escolha os produtos disponíveis.",
    },
    {
      title: "Monte seu pedido.",
      description: "Confira itens, quantidades e observações.",
    },
    {
      title: "Envie pelo WhatsApp.",
      description: "Abra o resumo no WhatsApp e consulte a equipe.",
    },
  ];
  const move = (i: number, delta: number) => {
    const next = [...sections];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    patch({ sections: next });
  };
  return (
    <>
      <details open>
        <summary>Identidade digital — cores e tipografia do B</summary>
        <div className="form-grid">
          <label>
            Fonte
            <select
              value={b.typeface ?? "modern"}
              onChange={(e) =>
                patch({
                  typeface: e.target.value as RestaurantDigital["typeface"],
                })
              }
            >
              <option value="modern">Moderna</option>
              <option value="rounded">Humanista</option>
            </select>
          </label>
          <label>
            Ícone da marca
            <select
              value={b.brandIcon ?? "utensils"}
              onChange={(e) =>
                patch({
                  brandIcon: e.target.value as RestaurantDigital["brandIcon"],
                })
              }
            >
              {digitalIcons.map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
          </label>
          {Object.entries(digitalColors).map(([key, color]) => (
            <label key={key}>
              {key}
              <input
                type="color"
                value={b.colors?.[key as keyof typeof digitalColors] ?? color}
                onChange={(e) =>
                  patch({ colors: { ...b.colors, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
        <p>
          As configurações visuais digitais ficam separadas do A. Nome, logo,
          subtítulo, contatos e catálogo são compartilhados. Não existem fotos
          locais de hambúrgueres ou acompanhamentos; forneça fotos próprias
          compatíveis. Nenhuma foto de salmão é atribuída automaticamente a
          produtos.
        </p>
      </details>
      <details>
        <summary>Textos do site e mensagem do WhatsApp</summary>
        <div className="form-grid">
          {(Object.keys(digitalCopy) as (keyof typeof digitalCopy)[]).map(
            (key) => (
              <label key={key}>
                {labels[key]}
                <textarea
                  value={b.copy?.[key] ?? ""}
                  placeholder={digitalCopy[key]}
                  maxLength={
                    key.endsWith("Cta")
                      ? 100
                      : key.endsWith("Title")
                        ? 255
                        : key.startsWith("whatsapp")
                          ? 500
                          : 1000
                  }
                  onChange={(e) =>
                    patch({ copy: { ...b.copy, [key]: e.target.value } })
                  }
                />
              </label>
            ),
          )}
        </div>
      </details>
      <details>
        <summary>Fotografias do B</summary>
        {(["hero", "about", "contact"] as const).map((slot) => (
          <div key={slot}>
            {renderPhoto({
              label: {
                hero: "Hero (produto ou ambiente)",
                about: "Sobre",
                contact: "Contato",
              }[slot],
              value:
                b.images?.[slot] ??
                restaurantPhotos[slot === "about" ? "history" : slot],
              onChange: (photo) =>
                patch({ images: { ...b.images, [slot]: photo } }),
            })}
          </div>
        ))}
      </details>
      <details>
        <summary>Carrinho e integridade do pedido</summary>
        <label>
          Limite de unidades por produto (1 a 99)
          <input
            type="number"
            min={1}
            max={99}
            step={1}
            value={b.maxQuantity ?? 20}
            onChange={(e) => patch({ maxQuantity: e.target.valueAsNumber })}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={b.showSubtotal !== false}
            onChange={(e) => patch({ showSubtotal: e.target.checked })}
          />
          Exibir subtotal no resumo e na mensagem
        </label>
        <p>
          O total estimado e o aviso de confirmação permanecem obrigatórios.
          Exemplos demonstrativos, itens indisponíveis, categorias ocultas e
          produtos sem preço válido em centavos não entram no pedido.
          Observações limitadas a 500 caracteres. O carrinho usa apenas estado
          React e é limpo ao atualizar ou sair da página.
        </p>
      </details>
      <details>
        <summary>Benefícios e como pedir</summary>
        <label>
          <input
            type="checkbox"
            checked={b.showBenefits !== false}
            onChange={(e) => patch({ showBenefits: e.target.checked })}
          />
          Exibir barra de benefícios (somente funções disponíveis)
        </label>
        {benefits.map((v, index) => (
          <fieldset key={index}>
            <legend>Benefício {index + 1}</legend>
            <input
              aria-label={`Título do benefício ${index + 1}`}
              maxLength={160}
              value={v.title}
              onChange={(e) =>
                patch({
                  benefits: benefits.map((item, i) =>
                    i === index ? { ...item, title: e.target.value } : item,
                  ),
                })
              }
            />
            <textarea
              aria-label={`Descrição do benefício ${index + 1}`}
              maxLength={500}
              value={v.description}
              onChange={(e) =>
                patch({
                  benefits: benefits.map((item, i) =>
                    i === index
                      ? { ...item, description: e.target.value }
                      : item,
                  ),
                })
              }
            />
          </fieldset>
        ))}
        {steps.map((v, index) => (
          <fieldset key={index}>
            <legend>Etapa {index + 1}</legend>
            <input
              aria-label={`Título da etapa ${index + 1}`}
              maxLength={160}
              value={v.title}
              onChange={(e) =>
                patch({
                  steps: steps.map((item, i) =>
                    i === index ? { ...item, title: e.target.value } : item,
                  ),
                })
              }
            />
            <textarea
              aria-label={`Descrição da etapa ${index + 1}`}
              maxLength={500}
              value={v.description}
              onChange={(e) =>
                patch({
                  steps: steps.map((item, i) =>
                    i === index
                      ? { ...item, description: e.target.value }
                      : item,
                  ),
                })
              }
            />
          </fieldset>
        ))}
        <p>
          A terceira etapa e o benefício do WhatsApp acompanham a
          disponibilidade real da configuração.
        </p>
      </details>
      <details>
        <summary>Ícones das categorias e banner</summary>
        {(categories ?? []).map((cat) => (
          <label key={cat.id}>
            {cat.name || "Categoria sem nome"}
            <select
              value={
                b.categoryIcons?.find((i) => i.categoryId === cat.id)?.icon ??
                "utensils"
              }
              onChange={(e) =>
                patch({
                  categoryIcons: [
                    ...(b.categoryIcons ?? []).filter(
                      (i) => i.categoryId !== cat.id,
                    ),
                    {
                      categoryId: cat.id,
                      icon: e.target.value as (typeof digitalIcons)[number],
                    },
                  ],
                })
              }
            >
              {digitalIcons.map((icon) => (
                <option key={icon}>{icon}</option>
              ))}
            </select>
          </label>
        ))}
        <label>
          Categoria correspondente ao banner
          <select
            value={b.bannerCategoryId ?? ""}
            onChange={(e) =>
              patch({ bannerCategoryId: e.target.value || null })
            }
          >
            <option value="">Sem banner de oferta</option>
            {(categories ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name || "Categoria sem nome"}
              </option>
            ))}
          </select>
        </label>
        {renderPhoto({
          label: "Fotografia do banner",
          value: b.bannerImage ?? restaurantPhotos.hero,
          onChange: (photo) => patch({ bannerImage: photo }),
        })}
        <p>
          O banner só aparece quando a categoria selecionada está visível e
          contém produto real disponível para pedido. Não há promoção ou
          categoria criada automaticamente.
        </p>
      </details>
      <details>
        <summary>Ordem e visibilidade das seções do B</summary>
        {sections.map((section, index) => (
          <div key={section} className="button-row">
            <span>{sectionLabels[section]}</span>
            <button
              type="button"
              disabled={!index}
              onClick={() => move(index, -1)}
            >
              Subir
            </button>
            <button
              type="button"
              disabled={index === sections.length - 1}
              onClick={() => move(index, 1)}
            >
              Descer
            </button>
            <button
              type="button"
              onClick={() =>
                patch({ sections: sections.filter((s) => s !== section) })
              }
            >
              Ocultar
            </button>
          </div>
        ))}
        {digitalSections
          .filter((s) => !sections.includes(s))
          .map((section) => (
            <button
              type="button"
              key={section}
              onClick={() => patch({ sections: [...sections, section] })}
            >
              Mostrar {sectionLabels[section]}
            </button>
          ))}
      </details>
    </>
  );
}
