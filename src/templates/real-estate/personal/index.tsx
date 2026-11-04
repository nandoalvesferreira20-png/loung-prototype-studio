"use client";
import Image from "next/image";
import {
  ArrowRight,
  UsersRound,
  Target,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Maximize,
  BedDouble,
  Car,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Navigation } from "../../clinics/shared/navigation";
import { EstatePhotoFrame } from "../premium/photo";
import { estatePhotos } from "../premium/photography";
import { propertyPrice } from "../premium/catalog";
import type { EstateModel } from "../premium/model";
import type { EstateSection } from "../../../lib/generation/real-estate-design";
import {
  personalColors,
  personalSections,
  personalBenefits,
  personalSteps,
} from "./content";
export function PersonalEstate({ model: m }: { model: EstateModel }) {
  const c = m.confirmed,
    d = m.design,
    personal = d?.personal,
    solo = d?.leadType !== "agency";
  const enabled: readonly EstateSection[] = d?.sections ?? personalSections;
  const has = (s: EstateSection) => enabled.includes(s);
  const contact =
    m.whatsapp ||
    m.telephone ||
    (d?.email ? `mailto:${d.email}` : null) ||
    c.website ||
    c.instagram;
  const target = has("contact") ? "#contato" : "#informacoes";
  const catalog = has("properties");
  const properties = (d?.properties ?? []).filter(
    (p) => p.status !== "inativo",
  );
  const button = (text: string, href: string, outline = false) => (
    <a className={`peButton ${outline ? "peOutline" : ""}`} href={href}>
      {text}
      <ArrowRight size={18} />
    </a>
  );
  const portrait = (slot: "hero" | "about") => {
    const p = personal?.portraits?.[slot];
    if (p && !p.src)
      return (
        <div
          className="pePortraitEmpty"
          aria-label="Apresentação sem fotografia"
        >
          <span>{m.monogram}</span>
        </div>
      );
    return p ? (
      <EstatePhotoFrame
        key={`${slot}-${p.src}`}
        photo={p}
        illustrative={p.demonstration}
        hero={slot === "hero"}
      />
    ) : (
      <EstatePhotoFrame
        photo={
          slot === "hero"
            ? estatePhotos.editorial
            : (d?.images?.about ?? estatePhotos.about)
        }
        hero={slot === "hero"}
      />
    );
  };
  const brand = (
    <a href="#inicio" className="peBrand">
      {d?.logo ? (
        <Image src={d.logo} alt="" width={48} height={48} />
      ) : (
        d?.brandMark !== "none" && (
          <span className="peMonogram">{m.monogram}</span>
        )
      )}
      <span>
        <strong>{c.name}</strong>
        <small>{d?.professionalLabel || "Consultoria imobiliária"}</small>
      </span>
    </a>
  );
  const nav = [
    { href: "#inicio", label: "Início" },
    ...(has("about")
      ? [{ href: "#sobre", label: solo ? "Sobre Mim" : "Sobre Nós" }]
      : []),
    ...(catalog ? [{ href: "#imoveis", label: "Imóveis" }] : []),
    ...(has("steps")
      ? [{ href: "#trabalho", label: solo ? "Meu Trabalho" : "Nosso Trabalho" }]
      : []),
    ...(has("contact") ? [{ href: "#contato", label: "Contato" }] : []),
  ];
  const contactDetails = (
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
            <b>Cidade e endereço</b>
            {m.location}
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
      {d?.creci && <p>CRECI: {d.creci}</p>}
      {!contact && !m.location && <p>Dados de contato ainda não informados.</p>}
    </address>
  );
  const sections: Record<EstateSection, ReactNode> = {
    about: (
      <section id="sobre" className="peWrap peSplit peAbout" key="about">
        {portrait("about")}
        <div>
          <span className="peEyebrow">
            {solo ? "Prazer, sou" : "Conheça"} {personal?.name || c.name}
          </span>
          <h2>
            {d?.aboutTitle ||
              (solo
                ? "Cada pessoa tem uma história. Meu trabalho é ajudar a encontrar o cenário ideal."
                : "Cada pessoa tem uma história. Nosso trabalho é ajudar a encontrar o cenário ideal.")}
          </h2>
          <p>
            {d?.aboutDescription ||
              c.description ||
              `Conheça ${c.name} e converse sobre seus objetivos e sobre as possibilidades para o seu próximo imóvel.`}
          </p>
          {button(
            d?.aboutCta ||
              (solo ? "Conheça Minha Trajetória" : "Conheça nosso atendimento"),
            contact || target,
          )}
        </div>
      </section>
    ),
    properties: (
      <section id="imoveis" className="peWrap peCatalog" key="properties">
        <header>
          <div>
            <h2>{d?.propertiesTitle || "Imóveis que merecem sua atenção."}</h2>
            <p>
              {d?.propertiesDescription ||
                "Uma seleção para conhecer novas possibilidades."}
            </p>
          </div>
        </header>
        {properties.length ? (
          <div className="peCards">
            {properties.map((p) => (
              <article key={p.id}>
                <div className="peCardPhoto">
                  <EstatePhotoFrame
                    photo={p.images[0] ?? { src: null }}
                    illustrative={p.demonstration}
                  />
                  <span className="peBadge">
                    {p.demonstration
                      ? "Demonstração"
                      : p.purpose === "venda"
                        ? "Venda"
                        : "Locação"}
                  </span>
                </div>
                <div className="peCardBody">
                  <h3>{p.title}</h3>
                  {p.demonstration && (
                    <p className="peDemo">Exemplo fictício · não disponível</p>
                  )}
                  {(p.city || p.neighborhood) && (
                    <p>
                      <MapPin size={14} />
                      {[p.neighborhood, p.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {p.featured && <small>Destaque</small>}
                  {p.status !== "disponivel" && <small>{p.status}</small>}
                  <div className="peFeatures">
                    {p.area != null && (
                      <span>
                        <Maximize />
                        {p.area} m²
                      </span>
                    )}
                    {p.bedrooms != null && (
                      <span>
                        <BedDouble />
                        {p.bedrooms} quartos
                      </span>
                    )}
                    {p.parking != null && (
                      <span>
                        <Car />
                        {p.parking} vagas
                      </span>
                    )}
                  </div>
                  <div className="peCardBottom">
                    {propertyPrice(p) && <strong>{propertyPrice(p)}</strong>}
                    <details>
                      <summary>Conhecer imóvel →</summary>
                      <div className="peDetails">
                        {p.images.slice(1).map((photo, i) => (
                          <EstatePhotoFrame
                            key={i}
                            photo={photo}
                            illustrative={p.demonstration}
                          />
                        ))}
                        {p.address && <p>{p.address}</p>}
                        {p.bathrooms != null && <p>{p.bathrooms} banheiros</p>}
                        <p>{p.description}</p>
                        {p.additional && <p>{p.additional}</p>}
                        {!p.demonstration &&
                          contact &&
                          button("Consultar imóvel", contact)}
                      </div>
                    </details>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="peEmpty">
            <span className="peEyebrow">
              Prévia demonstrativa · catálogo ainda não cadastrado
            </span>
            <h3>
              {d?.emptyTitle || "Seu próximo imóvel começa com uma conversa."}
            </h3>
            <p>
              {d?.emptyDescription ||
                "Nenhum anúncio foi cadastrado. As fotografias desta página são referências visuais e não representam imóveis disponíveis."}
            </p>
            {contact && button("Converse sobre seus planos", contact)}
          </div>
        )}
      </section>
    ),
    steps: (
      <section className="peSteps" id="trabalho" key="steps">
        <div className="peWrap">
          <h2>{d?.stepsTitle || "Um acompanhamento pensado para você."}</h2>
          {(d?.steps ?? personalSteps).map((s, i) => (
            <div key={i}>
              <span className="peNumber">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.title}</h3>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    editorial: (
      <section className="peBanner" key="editorial">
        <EstatePhotoFrame
          photo={d?.images?.editorial ?? estatePhotos.editorial}
        />
        <div className="peWrap">
          <h2>
            {d?.editorialTitle || "Um novo endereço. Novas possibilidades."}
          </h2>
          {d?.editorialDescription && <p>{d.editorialDescription}</p>}
          {button(
            d?.editorialCta ||
              (catalog ? "Explore os Imóveis" : "Vamos conversar"),
            catalog ? "#imoveis" : contact || target,
            true,
          )}
        </div>
      </section>
    ),
    conversion: (
      <section className="peWrap peSplit peConsult" key="conversion">
        <EstatePhotoFrame photo={d?.images?.hero ?? estatePhotos.contact} />
        <div>
          <h2>
            {d?.conversionTitle ||
              "Seu próximo imóvel começa com uma boa conversa."}
          </h2>
          <p>
            {d?.conversionDescription ||
              "Compartilhe o que você busca e conheça as possibilidades para seu próximo passo."}
          </p>
          {contact &&
            button(
              d?.conversionCta ||
                (m.whatsapp ? "Falar pelo WhatsApp" : "Entre em contato"),
              contact,
            )}
        </div>
      </section>
    ),
    contact: (
      <section className="peContact" id="contato" key="contact">
        <div className="peWrap">
          <div>
            <h2>
              {d?.contactTitle || "Vamos encontrar o lugar certo para você?"}
            </h2>
            <p>
              {d?.contactDescription ||
                "Entre em contato e dê o primeiro passo rumo ao seu novo imóvel."}
            </p>
          </div>
          {contactDetails}
          <EstatePhotoFrame
            photo={d?.images?.contact ?? estatePhotos.editorial}
          />
        </div>
      </section>
    ),
    categories: null,
    services: c.services.length ? (
      <section className="peWrap peServices" id="servicos" key="services">
        <h2>{d?.servicesTitle || "Atendimento"}</h2>
        {c.services.map((s) => (
          <p key={s}>{s}</p>
        ))}
      </section>
    ) : null,
  };
  return (
    <div
      className={`estatePersonal peFont-${d?.typeface || "editorial"}`}
      id="inicio"
      style={
        Object.fromEntries(
          Object.entries({ ...personalColors, ...d?.colors }).map(([k, v]) => [
            `--pe-${k}`,
            v,
          ]),
        ) as CSSProperties
      }
    >
      <header className="peHeader">
        <div className="peWrap">
          {brand}
          <Navigation links={nav} />
          {contact &&
            button(
              m.whatsapp ? "Vamos Conversar" : "Entre em contato",
              contact,
            )}
        </div>
      </header>
      <main>
        <section className="peHero">
          <div className="peHeroPhoto">{portrait("hero")}</div>
          <div className="peWrap">
            <div className="peHeroCopy">
              <span className="peEyebrow">
                {d?.professionalLabel || "Consultoria imobiliária"}
              </span>
              <h1>
                {d?.heroTitle || "Seu próximo capítulo começa com o"}{" "}
                <em>
                  {personal?.heroHighlight ??
                    (d?.heroTitle ? "" : "lugar certo.")}
                </em>
              </h1>
              <p>
                {d?.heroDescription ||
                  "Uma experiência imobiliária personalizada para acompanhar você na busca pelo imóvel ideal."}
              </p>
              <div className="peActions">
                {button(
                  d?.heroPrimaryCta ||
                    (solo ? "Conheça Meu Trabalho" : "Conheça Nosso Trabalho"),
                  has("steps")
                    ? "#trabalho"
                    : has("about")
                      ? "#sobre"
                      : contact || target,
                )}
                {catalog &&
                  button(
                    d?.heroSecondaryCta || "Ver Imóveis",
                    "#imoveis",
                    true,
                  )}
              </div>
            </div>
          </div>
        </section>
        <div className="peWrap peBenefits">
          {(personal?.benefits ?? personalBenefits).map((b, i) => {
            const Icon = [UsersRound, Target, MessageCircle][i];
            return (
              <div key={i}>
                <Icon />
                <span>
                  <b>{b.title}</b>
                  <small>{b.description}</small>
                </span>
              </div>
            );
          })}
        </div>
        {enabled.map((s) => sections[s])}
      </main>
      <footer className="peFooter" id="informacoes">
        <div className="peWrap peFooterGrid">
          <div>
            {brand}
            <p>
              {d?.footerDescription ||
                `Consultoria imobiliária. Conheça ${c.name} e compartilhe seus planos.`}
            </p>
          </div>
          <div>
            <h3>Navegação</h3>
            {nav.map((n) => (
              <a key={n.href} href={n.href}>
                {n.label}
              </a>
            ))}
          </div>
          <div>
            <h3>Contato</h3>
            {contactDetails}
          </div>
          <div>
            <h3>Acompanhe</h3>
            {c.instagram && <a href={c.instagram}>Instagram</a>}
            {m.whatsapp && <a href={m.whatsapp}>WhatsApp</a>}
          </div>
        </div>
        <div className="peWrap peCredit">
          <span>
            © {new Date().getFullYear()} {c.name}
          </span>
          <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
        </div>
      </footer>
    </div>
  );
}
