import Image from "next/image";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Leaf,
  HeartPulse,
  Building2,
  MessageCircle,
  MapPin,
  Stethoscope,
} from "lucide-react";
import type { ClinicModel } from "../shared/adapter";
import { Navigation } from "../shared/navigation";
import { ContactLinks, Location } from "../shared/sections";
import { premiumContent } from "./content";
import {
  premiumPhotography,
  roomPhoto,
  type PremiumPhotography,
  type PremiumPhoto,
} from "./photography";
import { PremiumPhotoFrame } from "./photo";

export function PremiumClinic({
  model: m,
  photography,
}: {
  model: ClinicModel;
  photography?: PremiumPhotography;
}) {
  const d = m.design;
  const copy = premiumContent(m);
  const sections = d?.sections ?? ["services", "about", "structure", "contact"];
  const enabled = (id: string) =>
    sections.includes(id as (typeof sections)[number]);
  const contactHref = m.whatsappUrl ?? m.telephone ?? "#contato";
  const cta =
    d?.cta ||
    (m.whatsappUrl
      ? "Conversar pelo WhatsApp"
      : m.telephone
        ? "Fale com a clínica"
        : "Ver formas de contato");
  const defaults =
    photography ??
    (m.specialtyId === "general"
      ? premiumPhotography
      : { hero: null, institutional: null, detail: null });
  function photo(
    slot: "hero" | "institutional" | "detail" | "room",
  ): PremiumPhoto | null {
    const base =
      slot === "room"
        ? !photography && m.specialtyId === "general"
          ? roomPhoto
          : null
        : defaults[slot];
    const src = d?.images?.[slot];
    if (src === null) return null;
    return src
      ? {
          src,
          alt: "Referência visual conceitual; não representa esta clínica",
          width: 1536,
          height: 1024,
          position: d?.positions?.[slot] ?? "center",
        }
      : base
        ? { ...base, position: d?.positions?.[slot] ?? base.position }
        : null;
  }
  const links = [
    { href: "#inicio", label: "Início" },
    ...(enabled("about") ? [{ href: "#sobre", label: "Sobre" }] : []),
    ...(enabled("services") && m.services.length
      ? [{ href: "#servicos", label: "Especialidades" }]
      : []),
    ...(enabled("structure")
      ? [{ href: "#estrutura", label: "Estrutura" }]
      : []),
    { href: "#contato", label: "Contato" },
  ];
  const contact = (
    <a
      className="cta"
      href={contactHref}
      {...(m.whatsappUrl
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      <MessageCircle size={18} />
      {cta}
      <ArrowRight size={16} />
    </a>
  );
  const blocks = {
    services:
      m.services.length > 0 ? (
        <section id="servicos" className="premiumServices" key="services">
          <div className="premiumSectionHeading">
            <div>
              <span className="eyebrow">Especialidades e serviços</span>
              <h2>
                {d?.servicesTitle || "Conheça as possibilidades de atendimento"}
              </h2>
            </div>
            <a className="textLink" href="#contato">
              Consulte a disponibilidade <ArrowRight size={17} />
            </a>
          </div>
          <div className="premiumServiceGrid">
            {m.services.map((service, i) => (
              <article key={`${service}-${i}`}>
                <Stethoscope size={37} strokeWidth={1.3} />
                <h3>{service}</h3>
                <p>
                  {d?.serviceDescriptions?.[service] ||
                    "Entre em contato para informações sobre este atendimento."}
                </p>
                <a className="textLink" href="#contato">
                  Saiba mais <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null,
    about: (
      <section id="sobre" className="premiumAbout" key="about">
        <PremiumPhotoFrame
          photo={photo("institutional")}
          fallback={defaults.institutional}
          role="institutional"
        />
        <div>
          <span className="eyebrow">Sobre a clínica</span>
          <h2>{d?.aboutTitle || `Conheça ${m.name}`}</h2>
          <p>{m.description || copy.introduction}</p>
          {!m.description && (
            <small>
              Conteúdo de demonstração · apresentação sujeita à aprovação.
            </small>
          )}
          <div className="premiumAboutLinks">
            <a href="#contato">
              <MessageCircle />
              Informações sobre o atendimento
            </a>
            {m.services.length > 0 && enabled("services") && (
              <a href="#servicos">
                <HeartPulse />
                Serviços informados pela clínica
              </a>
            )}
            {m.maps && (
              <a href="#localizacao">
                <MapPin />
                Como chegar
              </a>
            )}
          </div>
          {contact}
        </div>
      </section>
    ),
    structure: (
      <section id="estrutura" className="premiumStructure" key="structure">
        <div className="premiumSectionHeading">
          <div>
            <span className="eyebrow">Referências de ambiente</span>
            <h2>
              {d?.structureTitle || "Um olhar para os espaços de cuidado"}
            </h2>
          </div>
          <p>
            Referências visuais conceituais. As imagens não representam
            instalações ou profissionais da clínica.
          </p>
        </div>
        <div className="premiumGallery">
          <PremiumPhotoFrame
            photo={photo("room")}
            fallback={m.specialtyId === "general" ? roomPhoto : null}
            role="room"
          />
          <PremiumPhotoFrame
            photo={photo("detail")}
            fallback={defaults.detail}
            role="detail"
          />
          <PremiumPhotoFrame
            photo={photo("hero")}
            fallback={defaults.hero}
            role="detail"
          />
        </div>
      </section>
    ),
    contact: (
      <section className="premiumContactBanner" key="contact">
        <div>
          <h2>{d?.contactTitle || "Entre em contato com a clínica"}</h2>
          <p>Consulte informações e disponibilidade de atendimento.</p>
        </div>
        {contact}
      </section>
    ),
  };
  return (
    <main
      className="clinic premium"
      id="inicio"
      data-template="clinicas-a"
      style={
        {
          "--forest": d?.primary ?? "#405638",
          "--paper": d?.secondary ?? "#faf8f5",
          "--button": d?.button ?? d?.primary ?? "#405638",
        } as CSSProperties
      }
    >
      <a className="skipLink" href="#conteudo">
        Ir ao conteúdo
      </a>
      <header className="premiumHeader">
        <a className="identity" href="#inicio">
          {d?.logo ? (
            <Image
              src={d.logo}
              alt={`Logo de ${m.name}`}
              width={48}
              height={48}
            />
          ) : (
            <Leaf size={42} strokeWidth={1.2} />
          )}
          <span className="premiumBrand">
            <strong>{m.name}</strong>
            <small>{d?.subtitle || m.specialty || "Saúde e bem-estar"}</small>
          </span>
        </a>
        <Navigation links={links} />
        <div className="premiumHeaderCta">{contact}</div>
      </header>
      <section id="conteudo" className="premiumHero">
        <div className="premiumHeroVisual">
          <PremiumPhotoFrame
            photo={photo("hero")}
            fallback={defaults.hero}
            role="hero"
            priority
          />
        </div>
        <div className="premiumHeroCopy">
          <span className="eyebrow">{m.specialty || "Conheça a clínica"}</span>
          <h1>{copy.headline}</h1>
          <p>
            {d?.heroDescription ||
              `Conheça ${m.name}, suas informações de atendimento e encontre a melhor forma de entrar em contato.`}
          </p>
          <div className="premiumHeroActions">
            {contact}
            {enabled("about") && (
              <a className="premiumSecondary" href="#sobre">
                Conheça a clínica <ArrowRight size={17} />
              </a>
            )}
          </div>
          <small>
            Conteúdo de demonstração · apresentação sujeita à aprovação.
          </small>
        </div>
      </section>
      <nav className="premiumSectionNav" aria-label="Explore a apresentação">
        {enabled("about") && (
          <a href="#sobre">
            <Stethoscope />
            Conheça a clínica
          </a>
        )}
        {m.services.length > 0 && enabled("services") && (
          <a href="#servicos">
            <HeartPulse />
            Especialidades disponíveis
          </a>
        )}
        <a href="#contato">
          <MessageCircle />
          Informações de contato
        </a>
        {m.maps ? (
          <a href="#localizacao">
            <MapPin />
            Localização
          </a>
        ) : (
          enabled("structure") && (
            <a href="#estrutura">
              <Building2 />
              Referências de ambiente
            </a>
          )
        )}
      </nav>
      {sections.map((id) => blocks[id])}
      {d?.reviews && d.reviews.length > 0 && (
        <section className="premiumReviews">
          <span className="eyebrow">Avaliações autorizadas</span>
          <h2>Experiências compartilhadas</h2>
          <div className="premiumServiceGrid">
            {d.reviews
              .filter((r) => r.authorized)
              .map((r, i) => (
                <blockquote key={i}>
                  <p>{r.quote}</p>
                  <strong>{r.name}</strong>
                  <a href={r.source} target="_blank" rel="noopener noreferrer">
                    Ver avaliação original
                  </a>
                </blockquote>
              ))}
          </div>
        </section>
      )}
      <section id="contato" className="premiumContact">
        <div>
          <span className="eyebrow">Contato</span>
          <h2>Vamos conversar?</h2>
          <p>
            Disponibilidade e agendamentos são confirmados diretamente com a
            clínica.
          </p>
        </div>
        <ContactLinks model={m} />
      </section>
      <Location model={m} />
      <footer className="premiumFooter">
        <div>
          <Leaf size={36} />
          <strong>{m.name}</strong>
          <p>{d?.subtitle || m.specialty || "Informações da clínica"}</p>
        </div>
        <div>
          <strong>Links rápidos</strong>
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>
        <div>
          <strong>Contato</strong>
          <ContactLinks model={m} />
        </div>
        {m.location && (
          <div>
            <strong>Localização</strong>
            <p>{m.location}</p>
          </div>
        )}
        <div className="premiumLegal">
          <p>Protótipo demonstrativo desenvolvido pela Loung Tech.</p>
          <a href="#inicio">Voltar ao início ↑</a>
        </div>
      </footer>
    </main>
  );
}
