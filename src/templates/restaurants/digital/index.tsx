"use client";
import Image from "next/image";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  ShoppingCart,
  ClipboardList,
  MessageCircle,
  Zap,
  Utensils,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  X,
} from "lucide-react";
import {
  digitalColors,
  digitalCopy,
  digitalSections,
  type RestaurantItem,
} from "../../../lib/generation/restaurant-design";
import { Navigation } from "../../clinics/shared/navigation";
import { RestaurantPhotoFrame } from "../premium/photo";
import { restaurantPhotos } from "../premium/photography";
import {
  digitalCatalog,
  priceInCents,
  formatCents,
  canOrder,
  cartSummary,
  reconcileCart,
  changeCart,
  cleanNotes,
  type CartEntry,
} from "./cart";
import { CartPanel } from "./cart-panel";
import { foodIcons } from "./icons";
import type { DigitalRestaurantModel } from "./model";
function ProductPhoto({ item }: { item: RestaurantItem }) {
  return item.image?.src ? (
    <RestaurantPhotoFrame photo={item.image} />
  ) : (
    <div className="rdProductFallback">
      <Utensils />
      <span>Foto do produto pendente</span>
    </div>
  );
}
export function DigitalRestaurant({
  model: m,
}: {
  model: DigitalRestaurantModel;
}) {
  const c = m.confirmed,
    d = m.design,
    b = d?.digital,
    copy = { ...digitalCopy, ...b?.copy };
  const sections = b?.sections ?? digitalSections,
    has = (s: (typeof digitalSections)[number]) => sections.includes(s);
  const catalog = digitalCatalog(d),
    hasMenu = has("menu") && catalog.length > 0,
    orderable = catalog.filter(canOrder),
    canCheckout = hasMenu && orderable.length > 0 && Boolean(m.whatsapp);
  const categories = [...(d?.categories ?? [])]
    .filter(
      (cat) => !cat.hidden && catalog.some((i) => i.categoryId === cat.id),
    )
    .sort((a, b) => a.order - b.order);
  const hasSteps = has("steps") && hasMenu && orderable.length > 0;
  const target = has("contact") ? "#contato" : "#informacoes";
  const [category, setCategory] = useState("");
  const cartSignature = JSON.stringify([
    m.scope,
    d?.items,
    d?.categories,
    b?.maxQuantity,
    b?.sections,
  ]);
  const [state, setState] = useState<{
    signature: string;
    entries: CartEntry[];
  }>({ signature: cartSignature, entries: [] });
  if (state.signature !== cartSignature)
    setState({
      signature: cartSignature,
      entries: has("menu") ? reconcileCart(state.entries, d) : [],
    });
  const entries = reconcileCart(state.entries, d),
    summary = cartSummary(entries, d);
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");
  const drawer = useRef<HTMLDialogElement>(null);
  const update = (id: string, delta: number) =>
    setState((current) => ({
      signature: cartSignature,
      entries: changeCart(current.entries, id, delta, d),
    }));
  const remove = (id: string) =>
    setState((current) => ({
      ...current,
      entries: current.entries.filter((e) => e.id !== id),
    }));
  const clear = () => {
    setState({ signature: cartSignature, entries: [] });
    setNotes("");
  };
  const openCart = () => {
    if (!has("menu") || window.matchMedia("(max-width: 900px)").matches)
      drawer.current?.showModal();
    else
      document
        .getElementById("pedido")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const panel = (id: string) => (
    <CartPanel
      id={id}
      entries={entries}
      design={d}
      phone={c.whatsapp}
      notes={notes}
      onNotes={(value) => setNotes(cleanNotes(value))}
      onChange={update}
      onRemove={remove}
      onClear={clear}
    />
  );
  const nav = [
    { href: "#inicio", label: "Início" },
    ...(hasMenu ? [{ href: "#cardapio", label: "Cardápio" }] : []),
    ...(hasMenu && catalog.some((i) => i.featured)
      ? [{ href: "#destaques", label: "Destaques" }]
      : []),
    ...(has("about") ? [{ href: "#sobre", label: "Sobre" }] : []),
    ...(has("contact") ? [{ href: "#contato", label: "Contato" }] : []),
  ];
  const BrandIcon = foodIcons[b?.brandIcon ?? "utensils"];
  const brand = (
    <a className="rdBrand" href="#inicio">
      {d?.logo ? (
        <Image src={d.logo} alt="" width={46} height={46} />
      ) : (
        <BrandIcon />
      )}
      <span>
        <strong>{c.name}</strong>
        {d?.subtitle !== "" && (
          <small>{d?.subtitle ?? c.specialty ?? "Cardápio digital"}</small>
        )}
      </span>
    </a>
  );
  const button = (text: string, href: string, outline = false) => (
    <a className={`rdButton ${outline ? "rdOutline" : ""}`} href={href}>
      {text}
      <ArrowRight size={18} />
    </a>
  );
  const currentCategory = categories.some((cat) => cat.id === category)
    ? category
    : "";
  const filtered = catalog.filter(
    (item) => !currentCategory || item.categoryId === currentCategory,
  );
  const benefitDefaults = [
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
  const benefits = (b?.benefits ?? benefitDefaults)
    .map((value, index) => ({ ...value, index }))
    .filter(
      ({ index }) =>
        [
          hasMenu,
          hasMenu && orderable.length > 0,
          canCheckout,
          Boolean(m.contact),
        ][index],
    );
  const stepsDefaults = [
    {
      title: "Escolha seus favoritos.",
      description: "Navegue pelo cardápio e escolha os produtos disponíveis.",
    },
    {
      title: "Monte seu pedido.",
      description: "Confira itens, quantidades e observações.",
    },
    {
      title: canCheckout ? "Envie pelo WhatsApp." : "Consulte o atendimento.",
      description: canCheckout
        ? "Abra o resumo no WhatsApp e consulte a equipe."
        : "O WhatsApp de pedidos ainda não está configurado. Consulte outro canal confirmado.",
    },
  ];
  const configuredSteps = b?.steps ?? stepsDefaults;
  const steps = configuredSteps.map((step, index) =>
    index === 2 && !canCheckout ? stepsDefaults[2] : step,
  );
  const bannerCategory = categories.find(
    (cat) =>
      cat.id === b?.bannerCategoryId &&
      catalog.some((item) => item.categoryId === cat.id && canOrder(item)),
  );
  const allSections: Record<(typeof digitalSections)[number], ReactNode> = {
    menu: (
      <section id="cardapio" key="menu" className="rdWrap rdMenu">
        <h2>{copy.categoriesTitle}</h2>
        {categories.length > 0 && (
          <div
            className="rdCategories"
            role="group"
            aria-label="Categorias do cardápio"
          >
            <button
              type="button"
              aria-pressed={!currentCategory}
              onClick={() => setCategory("")}
            >
              <Utensils />
              Todos<small>{catalog.length}</small>
            </button>
            {categories.map((cat) => {
              const Icon =
                foodIcons[
                  b?.categoryIcons?.find((i) => i.categoryId === cat.id)
                    ?.icon ?? "utensils"
                ];
              return (
                <button
                  type="button"
                  key={cat.id}
                  aria-pressed={cat.id === currentCategory}
                  onClick={() => setCategory(cat.id)}
                >
                  <Icon />
                  {cat.name}
                  <small>
                    {catalog.filter((i) => i.categoryId === cat.id).length}
                  </small>
                </button>
              );
            })}
          </div>
        )}
        <div className="rdOrdering">
          <div>
            <header className="rdMenuHeading" id="destaques">
              <h2>
                {!currentCategory && catalog.some((item) => item.featured)
                  ? copy.featuredTitle
                  : copy.menuTitle}
              </h2>
              <p>{copy.menuDescription}</p>
            </header>
            {catalog.length ? (
              <div className="rdProducts">
                {filtered.map((item) => {
                  const cents = priceInCents(item.price),
                    eligible = canOrder(item),
                    inCart =
                      entries.find((e) => e.id === item.id)?.quantity ?? 0;
                  return (
                    <article key={item.id} className="rdProduct">
                      <ProductPhoto item={item} />
                      <div className="rdProductBody">
                        <h3>{item.name}</h3>
                        <p>{item.description}</p>
                        {item.featured && (
                          <small className="rdFeatured">Destaque</small>
                        )}
                        {item.demonstration && (
                          <small className="rdDemo">
                            Exemplo demonstrativo · não disponível para pedido
                          </small>
                        )}
                        {!item.available && (
                          <small className="rdUnavailable">Indisponível</small>
                        )}
                        {cents === null && (
                          <small className="rdUnavailable">
                            Preço sob consulta
                          </small>
                        )}
                        <div className="rdProductBottom">
                          {cents !== null && (
                            <strong>{formatCents(cents)}</strong>
                          )}
                          <button
                            type="button"
                            disabled={
                              !eligible || inCart >= (b?.maxQuantity ?? 20)
                            }
                            aria-label={`Adicionar ${item.name}`}
                            onClick={() => {
                              update(item.id, 1);
                              setNotice(`${item.name} adicionado ao pedido.`);
                            }}
                          >
                            Adicionar +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rdEmpty">
                <Utensils />
                <h3>{copy.emptyTitle}</h3>
                <p>{copy.emptyDescription}</p>
                {m.contact && button("Converse com a equipe", m.contact)}
              </div>
            )}
          </div>
          <aside className="rdDesktopCart" id="pedido">
            {panel("desktop")}
          </aside>
        </div>
      </section>
    ),
    banner:
      hasMenu && bannerCategory ? (
        <section className="rdBanner" key="banner">
          <RestaurantPhotoFrame
            photo={b?.bannerImage ?? b?.images?.hero ?? restaurantPhotos.hero}
            wide
          />
          <div className="rdWrap">
            <h2>{copy.bannerTitle}</h2>
            <a
              className="rdButton"
              href="#cardapio"
              onClick={() => setCategory(bannerCategory.id)}
            >
              {copy.bannerCta}
              <ArrowRight size={18} />
            </a>
          </div>
        </section>
      ) : null,
    steps: hasSteps ? (
      <section id="como-pedir" key="steps" className="rdSteps">
        <div className="rdWrap">
          <h2>{copy.stepsTitle}</h2>
          {steps.map((step, index) => {
            const Icon = [ShoppingCart, ClipboardList, MessageCircle][index];
            return (
              <div key={index}>
                <Icon />
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    ) : null,
    about: (
      <section id="sobre" key="about" className="rdWrap rdAbout">
        <RestaurantPhotoFrame
          photo={
            b?.images?.about ?? d?.images?.history ?? restaurantPhotos.history
          }
        />
        <div>
          <span className="rdEyebrow">Sobre {c.name}</span>
          <h2>{copy.aboutTitle}</h2>
          <p>
            {b?.copy?.aboutDescription ??
              c.description ??
              copy.aboutDescription}
          </p>
          {m.contact && button(copy.aboutCta, m.contact)}
        </div>
      </section>
    ),
    contact: (
      <section id="contato" key="contact" className="rdWrap rdContact">
        <div>
          <h2>{copy.contactTitle}</h2>
          <p>{copy.contactDescription}</p>
        </div>
        <address>
          {m.whatsapp && (
            <a href={m.whatsapp}>
              <MessageCircle />
              <span>
                <b>WhatsApp</b>
                {c.whatsapp}
              </span>
            </a>
          )}
          {m.telephone && (
            <a href={m.telephone}>
              <Phone />
              <span>
                <b>Telefone</b>
                {c.phone}
              </span>
            </a>
          )}
          {d?.email && (
            <a href={`mailto:${d.email}`}>
              <Mail />
              <span>
                <b>E-mail</b>
                {d.email}
              </span>
            </a>
          )}
          {m.location && (
            <p>
              <MapPin />
              <span>
                <b>Endereço</b>
                {m.location}
              </span>
            </p>
          )}
          {d?.openingHours && (
            <p>
              <Clock />
              <span>
                <b>Horário confirmado</b>
                {d.openingHours}
              </span>
            </p>
          )}
          {c.instagram && (
            <a href={c.instagram}>
              <Instagram />
              <span>
                <b>Instagram</b>
                {new URL(c.instagram).pathname.replaceAll("/", "")}
              </span>
            </a>
          )}
          {!m.contact && !m.location && !d?.openingHours && (
            <p>Contatos ainda não informados.</p>
          )}
        </address>
        <RestaurantPhotoFrame
          photo={
            b?.images?.contact ?? d?.images?.contact ?? restaurantPhotos.contact
          }
        />
      </section>
    ),
  };
  const highlight = copy.heroHighlight
    ? copy.heroTitle.indexOf(copy.heroHighlight)
    : -1;
  return (
    <div
      className={`restaurantDigital rdFont-${b?.typeface ?? "modern"}`}
      id="inicio"
      style={
        Object.fromEntries(
          Object.entries({ ...digitalColors, ...b?.colors }).map(([k, v]) => [
            `--rd-${k}`,
            v,
          ]),
        ) as CSSProperties
      }
    >
      <header className="rdHeader">
        <div className="rdWrap">
          {brand}
          <Navigation links={nav} />
          <button
            type="button"
            className="rdCartTrigger"
            onClick={openCart}
            aria-label={`Ver pedido, ${summary.count} itens`}
          >
            <ShoppingCart />
            <span>{summary.count}</span>
          </button>
          {hasMenu && (
            <button
              type="button"
              className="rdButton rdOrderTrigger"
              onClick={openCart}
            >
              Fazer Pedido
            </button>
          )}
        </div>
      </header>
      <main>
        <section className="rdHero">
          <RestaurantPhotoFrame
            photo={b?.images?.hero ?? d?.images?.hero ?? restaurantPhotos.hero}
            hero
          />
          <div className="rdWrap">
            <div>
              <span className="rdEyebrow">{copy.eyebrow}</span>
              <h1>
                {highlight >= 0 ? (
                  <>
                    {copy.heroTitle.slice(0, highlight)}
                    <em>{copy.heroHighlight}</em>
                    {copy.heroTitle.slice(
                      highlight + copy.heroHighlight.length,
                    )}
                  </>
                ) : (
                  copy.heroTitle
                )}
              </h1>
              <p>{copy.heroDescription}</p>
              <div className="rdActions">
                {button(
                  hasMenu
                    ? copy.heroPrimaryCta
                    : m.contact
                      ? "Entre em contato"
                      : "Informações",
                  hasMenu ? "#cardapio" : m.contact || target,
                )}
                {hasSteps && button(copy.heroSecondaryCta, "#como-pedir", true)}
              </div>
            </div>
          </div>
        </section>
        {b?.showBenefits !== false && benefits.length > 0 && (
          <div className="rdWrap rdBenefits">
            {benefits.map((benefit) => {
              const Icon = [ClipboardList, Utensils, MessageCircle, Zap][
                benefit.index
              ];
              return (
                <div key={benefit.index}>
                  <Icon />
                  <span>
                    <b>{benefit.title}</b>
                    <small>{benefit.description}</small>
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {sections.map((section) => allSections[section])}
      </main>
      <footer className="rdFooter" id="informacoes">
        <div className="rdWrap rdFooterGrid">
          <div>
            {brand}
            <p>{copy.footerDescription}</p>
          </div>
          <div>
            <h3>Navegação</h3>
            {nav.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          {hasMenu && categories.length > 0 && (
            <div>
              <h3>Cardápio</h3>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href="#cardapio"
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          )}
          <div>
            <h3>Contato</h3>
            {m.telephone && <a href={m.telephone}>{c.phone}</a>}
            {m.whatsapp && <a href={m.whatsapp}>{c.whatsapp}</a>}
            {d?.email && <a href={`mailto:${d.email}`}>{d.email}</a>}
            {m.location && <p>{m.location}</p>}
            {!m.contact && !m.location && <p>Contato não informado.</p>}
          </div>
          <div>
            <h3>Redes sociais</h3>
            {c.instagram && (
              <a href={c.instagram} aria-label="Instagram">
                <Instagram />
              </a>
            )}
            {c.website && <a href={c.website}>Website</a>}
          </div>
        </div>
        <div className="rdWrap rdCredit">
          <span>
            © {new Date().getFullYear()} {c.name}
          </span>
          <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
        </div>
      </footer>
      <div className="rdLive" role="status" aria-live="polite">
        {notice}
      </div>
      {summary.count > 0 && (
        <button className="rdMobileCart" type="button" onClick={openCart}>
          <ShoppingCart size={20} />
          {summary.count} {summary.count === 1 ? "item" : "itens"} · Ver pedido
          <strong>{formatCents(summary.totalCents)}</strong>
        </button>
      )}
      <dialog
        ref={drawer}
        className="rdDrawer"
        aria-label="Seu pedido"
        onClick={(event) => {
          if (event.target === event.currentTarget) drawer.current?.close();
        }}
      >
        <button
          className="rdDrawerClose"
          type="button"
          onClick={() => drawer.current?.close()}
          aria-label="Fechar carrinho"
        >
          <X />
          Fechar
        </button>
        {panel("mobile")}
      </dialog>
    </div>
  );
}
