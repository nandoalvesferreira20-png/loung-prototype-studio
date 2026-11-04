"use client";
import Image from "next/image";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { Navigation } from "../../clinics/shared/navigation";
import {
  restaurantColors,
  restaurantCopy,
  restaurantSections,
  type RestaurantSection,
} from "../../../lib/generation/restaurant-design";
import { restaurantPhotos, restaurantGallery } from "./photography";
import { RestaurantPhotoFrame } from "./photo";
import { restaurantPrice, type RestaurantModel } from "./model";

function Botanical({ decorative = false }: { decorative?: boolean }) {
  return (
    <svg
      className={decorative ? "rpBotanical rpDecoration" : "rpBotanical"}
      viewBox="0 0 90 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 73C29 59 44 34 78 9"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      {[
        "M21 62Q12 43 24 28Q31 46 21 62Z",
        "M29 53Q43 36 60 39Q48 52 29 53Z",
        "M38 42Q29 23 42 12Q47 28 38 42Z",
        "M48 32Q62 16 82 20Q67 33 48 32Z",
        "M59 21Q56 9 67 2Q69 14 59 21Z",
        "M14 69Q7 56 10 46Q19 55 14 69Z",
      ].map((path) => (
        <path key={path} d={path} fill="currentColor" />
      ))}
    </svg>
  );
}
export function PremiumRestaurant({ model: m }: { model: RestaurantModel }) {
  const c = m.confirmed,
    d = m.design;
  const copy = { ...restaurantCopy, ...d?.copy };
  const enabled = d?.sections ?? restaurantSections;
  const has = (s: RestaurantSection) => enabled.includes(s);
  const gallery = d?.gallery ?? restaurantGallery;
  const hasMenu = has("menu") && m.items.length > 0,
    hasGallery = has("gallery") && gallery.length > 0;
  const target = has("contact") ? "#contato" : "#informacoes";
  const [category, setCategory] = useState("");
  const [expanded, setExpanded] = useState(false);
  const categories = (d?.categories ?? [])
    .filter(
      (cat) => !cat.hidden && m.items.some((i) => i.categoryId === cat.id),
    )
    .sort((a, b) => a.order - b.order);
  const activeCategory = categories.some((cat) => cat.id === category)
    ? category
    : "";
  const filtered = m.items.filter(
    (i) => !activeCategory || i.categoryId === activeCategory,
  );
  const shown = expanded ? filtered : filtered.slice(0, d?.menuLimit ?? 3);
  const nav = [
    { href: "#inicio", label: "Início" },
    ...(has("history") ? [{ href: "#historia", label: "Nossa História" }] : []),
    ...(hasMenu ? [{ href: "#cardapio", label: "Cardápio" }] : []),
    ...(hasGallery ? [{ href: "#ambiente", label: "Ambiente" }] : []),
    ...(has("contact") ? [{ href: "#contato", label: "Contato" }] : []),
  ];
  const button = (
    text: string,
    href: string,
    kind: "gold" | "green" | "outline" = "green",
  ) => (
    <a className={`rpButton rpButton-${kind}`} href={href}>
      {text}
      <ArrowRight size={17} />
    </a>
  );
  const segment = {
    restaurant: "Restaurante",
    pizzeria: "Pizzaria",
    burger: "Hamburgueria",
    japanese: "Restaurante japonês",
    bistro: "Bistrô",
    cafe: "Cafeteria",
    other: "Gastronomia",
  }[d?.segment ?? "restaurant"];
  const brand = (
    <a className="rpBrand" href="#inicio">
      {d?.logo ? (
        <Image src={d.logo} alt="" width={68} height={54} />
      ) : d?.symbol === "monogram" ? (
        <span className="rpMonogram">{m.monogram}</span>
      ) : (
        d?.symbol !== "none" && <Botanical />
      )}
      <span>
        <strong>{c.name}</strong>
        {d?.subtitle !== "" && <small>{d?.subtitle ?? segment}</small>}
      </span>
    </a>
  );
  const photo = (slot: keyof typeof restaurantPhotos) =>
    d?.images?.[slot] ?? restaurantPhotos[slot];
  const contactDetails = (
    <address>
      {m.location && (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`}
        >
          <MapPin />
          <span>
            <b>Endereço</b>
            {m.location}
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
      {d?.openingHours && (
        <p>
          <Clock />
          <span>
            <b>Horário de funcionamento</b>
            {d.openingHours}
          </span>
        </p>
      )}
      {m.whatsapp && (
        <a href={m.whatsapp}>
          <MessageCircle />
          <span>
            <b>WhatsApp</b>
            {c.whatsapp}
          </span>
        </a>
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
      {d?.email && (
        <a href={`mailto:${d.email}`}>
          <Mail />
          <span>
            <b>E-mail</b>
            {d.email}
          </span>
        </a>
      )}
      {c.website && <a href={c.website}>Site informado pelo estabelecimento</a>}
      {!m.contact && !m.location && !d?.openingHours && (
        <p>Informações de atendimento ainda não cadastradas.</p>
      )}
    </address>
  );
  const sections: Record<RestaurantSection, ReactNode> = {
    introduction: (
      <section key="introduction" className="rpIntroduction">
        <Botanical decorative />
        <div className="rpWrap">
          <div>
            <span className="rpEyebrow">Bem-vindo a {c.name}</span>
            <h2>{copy.introductionTitle}</h2>
          </div>
          <p>
            {d?.copy?.introductionDescription ||
              c.description ||
              copy.introductionDescription}
          </p>
        </div>
      </section>
    ),
    gastronomy: (
      <section key="gastronomy" className="rpGastronomy">
        <div className="rpWrap rpSplit">
          <RestaurantPhotoFrame photo={photo("gastronomy")} />
          <div>
            <span className="rpEyebrow">
              {c.specialty || "Nossa gastronomia"}
            </span>
            <h2>{copy.gastronomyTitle}</h2>
            <p>{copy.gastronomyDescription}</p>
            {button(
              hasMenu
                ? copy.gastronomyCta
                : m.contact
                  ? "Entre em contato"
                  : "Informações",
              hasMenu ? "#cardapio" : m.contact || target,
            )}
          </div>
        </div>
        <Botanical decorative />
      </section>
    ),
    menu: (
      <section id="cardapio" key="menu" className="rpWrap rpMenu">
        <h2 className="rpSectionTitle">{copy.menuTitle}</h2>
        {m.items.length ? (
          <>
            <div className="rpCategories" aria-label="Categorias do cardápio">
              {categories.length > 0 && (
                <>
                  <button
                    type="button"
                    aria-pressed={!activeCategory}
                    onClick={() => {
                      setCategory("");
                      setExpanded(false);
                    }}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      aria-pressed={activeCategory === cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        setExpanded(false);
                      }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="rpMenuGrid">
              {shown.map((item) => (
                <article className="rpDish" key={item.id}>
                  <RestaurantPhotoFrame
                    photo={
                      item.image ?? {
                        src: null,
                        demonstration: item.demonstration,
                      }
                    }
                  />
                  <div className="rpDishBody">
                    <h3>{item.name}</h3>
                    {item.demonstration && (
                      <small className="rpDemo">
                        Exemplo demonstrativo · não é oferta do restaurante
                      </small>
                    )}
                    <p>{item.description}</p>
                    {item.featured && (
                      <span className="rpFeatured">Destaque</span>
                    )}
                    {restaurantPrice(item.price) && (
                      <strong>{restaurantPrice(item.price)}</strong>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {filtered.length > (d?.menuLimit ?? 3) && (
              <button
                className="rpButton rpButton-green rpMore"
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Mostrar destaques" : "Ver cardápio completo"}
                <ArrowRight size={17} />
              </button>
            )}
          </>
        ) : (
          <div className="rpEmpty">
            <RestaurantPhotoFrame photo={photo("gastronomy")} />
            <div>
              <span className="rpEyebrow">
                {(d?.items?.length ?? 0) > 0
                  ? "Prévia demonstrativa · sem produtos disponíveis"
                  : "Prévia demonstrativa · cardápio não cadastrado"}
              </span>
              <h3>{copy.emptyTitle}</h3>
              <p>
                {d?.copy?.emptyDescription ??
                  ((d?.items?.length ?? 0) > 0
                    ? "Não há produtos disponíveis para exibir nesta prévia. Consulte os canais do estabelecimento. A fotografia é apenas uma referência visual."
                    : copy.emptyDescription)}
              </p>
              {m.contact && button("Consulte o estabelecimento", m.contact)}
            </div>
          </div>
        )}
      </section>
    ),
    history: (
      <section id="historia" key="history" className="rpWrap rpSplit rpHistory">
        <RestaurantPhotoFrame photo={photo("history")} />
        <div>
          <h2>{copy.historyTitle}</h2>
          <p>{copy.historyDescription}</p>
          {m.contact && button(copy.historyCta, m.contact)}
        </div>
      </section>
    ),
    gallery: gallery.length ? (
      <section id="ambiente" key="gallery" className="rpWrap rpGallery">
        <h2 className="rpSectionTitle">{copy.galleryTitle}</h2>
        <div>
          {gallery.map((p, index) => (
            <RestaurantPhotoFrame key={`${index}-${p.src}`} photo={p} />
          ))}
        </div>
      </section>
    ) : null,
    conversion: (
      <section key="conversion" className="rpConversion">
        <Botanical decorative />
        <div className="rpWrap">
          <div>
            <h2>{copy.conversionTitle}</h2>
            <p>{copy.conversionDescription}</p>
          </div>
          {m.contact && button(copy.conversionCta, m.contact, "gold")}
        </div>
      </section>
    ),
    contact: (
      <section id="contato" key="contact" className="rpWrap rpContact">
        <div>
          <h2>{d?.copy?.contactTitle || `${copy.contactTitle} ${c.name}.`}</h2>
          <p>{copy.contactDescription}</p>
        </div>
        <div>
          {contactDetails}
          {m.contact &&
            button(
              m.whatsapp ? copy.contactCta : "Entre em contato",
              m.contact,
            )}
        </div>
        <RestaurantPhotoFrame photo={photo("contact")} />
      </section>
    ),
  };
  return (
    <div
      className={`restaurantPremium rpFont-${d?.typeface ?? "editorial"}`}
      id="inicio"
      style={
        Object.fromEntries(
          Object.entries({ ...restaurantColors, ...d?.colors }).map(
            ([k, v]) => [`--rp-${k}`, v],
          ),
        ) as CSSProperties
      }
    >
      <header className="rpHeader">
        <div className="rpWrap">
          {brand}
          <Navigation links={nav} />
          {m.contact && (
            <a href={m.contact} className="rpHeaderContact">
              <MessageCircle size={18} />
              Entre em Contato
            </a>
          )}
        </div>
      </header>
      <main>
        <section className="rpHero">
          <RestaurantPhotoFrame photo={photo("hero")} hero />
          <div className="rpWrap">
            <div className="rpHeroCopy">
              <h1>{copy.heroTitle}</h1>
              <p>{copy.heroDescription}</p>
              <div className="rpActions">
                {button(
                  hasMenu
                    ? copy.heroPrimaryCta
                    : m.contact
                      ? "Entre em Contato"
                      : "Informações",
                  hasMenu ? "#cardapio" : m.contact || target,
                  "gold",
                )}
                {hasGallery &&
                  button(copy.heroSecondaryCta, "#ambiente", "outline")}
              </div>
            </div>
          </div>
        </section>
        {enabled.map((s) => sections[s])}
      </main>
      <footer className="rpFooter" id="informacoes">
        <div className="rpWrap rpFooterGrid">
          <div>
            {brand}
            <p>{copy.footerDescription}</p>
          </div>
          <div>
            <h3>Navegação</h3>
            {nav.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </div>
          {hasMenu && categories.length > 0 && (
            <div>
              <h3>Cardápio</h3>
              {categories.map((cat) => (
                <a
                  href="#cardapio"
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setExpanded(true);
                  }}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          )}
          <div>
            <h3>Contato</h3>
            {m.telephone && (
              <a href={m.telephone}>
                <Phone size={14} />
                {c.phone}
              </a>
            )}
            {m.whatsapp && (
              <a href={m.whatsapp}>
                <MessageCircle size={14} />
                {c.whatsapp}
              </a>
            )}
            {d?.email && (
              <a href={`mailto:${d.email}`}>
                <Mail size={14} />
                {d.email}
              </a>
            )}
            {m.location && <p>{m.location}</p>}
            {!m.contact && !m.location && <p>Contato ainda não informado.</p>}
          </div>
          <div>
            <h3>Acompanhe</h3>
            {c.instagram && (
              <a href={c.instagram} aria-label="Instagram">
                <Instagram />
              </a>
            )}
            {c.website && <a href={c.website}>Website</a>}
          </div>
        </div>
        <div className="rpWrap rpCredits">
          <span>
            © {new Date().getFullYear()} {c.name}
          </span>
          <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
        </div>
      </footer>
    </div>
  );
}
