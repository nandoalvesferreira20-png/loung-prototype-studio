import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  Instagram,
  Linkedin,
  Globe,
} from "lucide-react";
import { Navigation } from "../../clinics/shared/navigation";
import {
  modernSections,
  type ModernSection,
} from "../../../lib/generation/law-modern-design";
import type { ModernLawModel } from "./model";
import { modernPhoto } from "./photography";
import { ModernPhotoFrame } from "./photo";
export function ModernLaw({ model: m }: { model: ModernLawModel }) {
  const d = m.design,
    sections = d?.sections ?? [...modernSections];
  const enabled = (id: ModernSection) => sections.includes(id);
  const contactHref =
    m.whatsappUrl ??
    m.telephone ??
    (d?.email
      ? `mailto:${d.email}`
      : (m.instagramUrl ?? d?.linkedin ?? m.websiteUrl ?? "#informacoes"));
  const hasChannel = contactHref !== "#informacoes";
  const destination = enabled("contact") ? "#contato" : "#informacoes";
  const external = (href: string) =>
    /^https?:/.test(href)
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
  const links = [
    { href: "#inicio", label: "Início" },
    ...(enabled("about")
      ? [{ href: "#escritorio", label: m.solo ? "Apresentação" : "Escritório" }]
      : []),
    ...(enabled("areas") && m.areas.length
      ? [{ href: "#atuacao", label: "Atuação" }]
      : []),
    ...(enabled("team") && m.team.length
      ? [{ href: "#profissionais", label: m.solo ? "Perfil" : "Profissionais" }]
      : []),
    { href: destination, label: "Contato" },
  ];
  const brand = () => (
    <a className="lmIdentity" href="#inicio">
      {d?.logo ? (
        <Image
          src={d.logo}
          alt={`Logotipo de ${m.name}`}
          width={42}
          height={42}
        />
      ) : d?.brandMark === "none" ? null : d?.brandMark === "geometry" ? (
        <span
          className="lmGeometry"
          aria-label="Símbolo geométrico demonstrativo"
        />
      ) : (
        <span
          className="lmMonogram"
          aria-label="Monograma tipográfico demonstrativo"
        >
          {m.monogram}
        </span>
      )}
      <span>
        <strong>{m.name}</strong>
        <small>{d?.professionalLabel || m.specialty || "Advocacia"}</small>
      </span>
    </a>
  );
  const contacts = [
    ...(d?.email
      ? [
          {
            id: "email",
            label: "E-mail",
            text: d.email,
            href: `mailto:${d.email}`,
            icon: Mail,
          },
        ]
      : []),
    ...(m.telephone
      ? [
          {
            id: "phone",
            label: "Telefone",
            text: m.phone!,
            href: m.telephone,
            icon: Phone,
          },
        ]
      : []),
    ...(m.whatsappUrl
      ? [
          {
            id: "whatsapp",
            label: "WhatsApp",
            text: m.whatsapp!,
            href: m.whatsappUrl,
            icon: MessageCircle,
          },
        ]
      : []),
    ...(m.location
      ? [
          {
            id: "address",
            label: "Localização",
            text: m.location,
            href: m.maps!,
            icon: MapPin,
          },
        ]
      : []),
  ];
  const socials = [
    ...(m.instagramUrl
      ? [{ label: "Instagram", href: m.instagramUrl, icon: Instagram }]
      : []),
    ...(d?.linkedin
      ? [{ label: "LinkedIn", href: d.linkedin, icon: Linkedin }]
      : []),
    ...(m.websiteUrl
      ? [{ label: "Site informado", href: m.websiteUrl, icon: Globe }]
      : []),
  ];
  const heroTarget =
    enabled("areas") && m.areas.length
      ? "#atuacao"
      : enabled("about")
        ? "#escritorio"
        : destination;
  const area = (name: string, i: number) => {
    const details = d?.areaDetails?.[name],
      href = details?.href || contactHref;
    return (
      <article key={`${name}-${i}`}>
        <span className="lmAreaNumber">{String(i + 1).padStart(2, "0")}</span>
        <h3>{name}</h3>
        <p>
          {details?.description ||
            "Consulte informações sobre esta área pelos canais de contato disponíveis."}
        </p>
        <a className="lmTextLink" href={href} {...external(href)}>
          {d?.areasCta || "Saiba mais"}
          <ArrowRight size={16} />
        </a>
      </article>
    );
  };
  const blocks: Record<ModernSection, ReactNode> = {
    manifesto: (
      <section
        key="manifesto"
        className="lmManifesto lmContainer"
        id="manifesto"
      >
        <h2>
          {d?.manifestoTitle || "Informação jurídica. Atenção a cada contexto."}
        </h2>
        <p>
          {d?.manifestoDescription ||
            `Conheça as informações de ${m.name}, consulte as áreas de atuação confirmadas e encontre um canal para conversar sobre sua necessidade.`}
        </p>
      </section>
    ),
    areas: m.areas.length ? (
      <section id="atuacao" key="areas" className="lmAreas">
        <div className="lmContainer">
          <h2>{d?.areasTitle || "Áreas de atuação."}</h2>
          {d?.areasDescription && (
            <p className="lmSectionIntro">{d.areasDescription}</p>
          )}
          <div
            className="lmAreasGrid"
            data-columns={Math.min(m.areas.length, 3)}
          >
            {m.areas.slice(0, 6).map(area)}
          </div>
          {m.areas.length > 6 && (
            <details className="lmMore">
              <summary>
                Outras áreas de atuação <ArrowRight size={16} />
              </summary>
              <div
                className="lmAreasGrid"
                data-columns={Math.min(m.areas.length - 6, 3)}
              >
                {m.areas.slice(6).map((a, i) => area(a, i + 6))}
              </div>
            </details>
          )}
        </div>
      </section>
    ) : null,
    about: (
      <section key="about" id="escritorio" className="lmAbout">
        <ModernPhotoFrame photo={modernPhoto(d, "about")} role="about" />
        <div>
          <h2>
            {d?.aboutTitle ||
              (m.solo
                ? "Conheça a apresentação profissional."
                : "Uma apresentação para conhecer o escritório.")}
          </h2>
          <p>{m.about}</p>
          {!d?.aboutDescription && !m.description && (
            <small className="lmDemo">
              Conteúdo de demonstração · sujeito à aprovação.
            </small>
          )}
          <a className="lmButton" href={contactHref} {...external(contactHref)}>
            {d?.aboutCta || "Conheça o escritório"}
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    ),
    team: m.team.length ? (
      <section key="team" id="profissionais" className="lmTeam lmContainer">
        <h2>
          {d?.teamTitle ||
            (m.solo
              ? "Conheça o perfil profissional."
              : "Conheça os profissionais apresentados.")}
        </h2>
        <div className="lmTeamGrid" data-single={m.team.length === 1}>
          {m.team.map((p, i) => (
            <article key={`${p.name}-${i}`}>
              {p.photo ? (
                <ModernPhotoFrame
                  role="team"
                  photo={{ src: p.photo, alt: p.name, illustrative: false }}
                />
              ) : (
                <div className="lmPersonInitials" aria-hidden="true">
                  {p.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")}
                </div>
              )}
              <div>
                <h3>{p.name}</h3>
                {p.role && <p className="lmPersonArea">{p.role}</p>}
                {p.area && <p className="lmPersonArea">{p.area}</p>}
                <span className="lmPersonRule" />
                {p.registration && <p>{p.registration}</p>}
                {p.description && <p>{p.description}</p>}
                {p.profileUrl && (
                  <a
                    className="lmTextLink"
                    href={p.profileUrl}
                    {...external(p.profileUrl)}
                  >
                    Conheça o perfil
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    ) : null,
    conversion: (
      <section key="conversion" className="lmConversion">
        <div className="lmContainer">
          <div>
            <h2>
              {d?.conversionTitle ||
                "Cada situação merece atenção. Cada decisão exige responsabilidade."}
            </h2>
            <p>
              {d?.conversionDescription ||
                "Conheça os canais informados para consultar informações de atendimento."}
            </p>
          </div>
          <a
            className="lmButton lmButtonLight"
            href={contactHref}
            {...external(contactHref)}
          >
            {d?.conversionCta ||
              (hasChannel ? "Fale conosco" : "Informações de contato")}
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    ),
    contact: (
      <section key="contact" id="contato" className="lmContact">
        <div>
          <h2>{d?.contactTitle || "Vamos conversar?"}</h2>
          <p>
            {d?.contactDescription ||
              "Consulte os canais informados para obter informações sobre o atendimento."}
          </p>
          <div className="lmContactList">
            {contacts.map((c) => (
              <a
                key={c.id}
                href={c.href}
                aria-label={`${c.label}: ${c.text}`}
                {...external(c.href)}
              >
                <c.icon size={23} />
                <span>{c.text}</span>
              </a>
            ))}
            {!contacts.length && (
              <p>Os canais de contato serão apresentados após confirmação.</p>
            )}
          </div>
        </div>
        <ModernPhotoFrame photo={modernPhoto(d, "contact")} role="contact" />
      </section>
    ),
  };
  return (
    <main
      className="lawModern"
      id="inicio"
      data-template="advocacia-b"
      data-typeface={d?.typeface ?? "geometric"}
      style={
        {
          "--lm-primary": d?.colors?.primary,
          "--lm-secondary": d?.colors?.secondary,
          "--lm-accent": d?.colors?.accent,
          "--lm-paper": d?.colors?.paper,
          "--lm-white": d?.colors?.white,
          "--lm-line": d?.colors?.line,
          "--lm-text": d?.colors?.text,
        } as CSSProperties
      }
    >
      <a className="lmSkip" href="#conteudo">
        Ir ao conteúdo
      </a>
      <header className="lmHeader">
        <div className="lmContainer">
          {brand()}
          <Navigation links={links} />
          <a className="lmButton lmHeaderCta" href={destination}>
            {d?.contactCta || "Entre em contato"}
          </a>
        </div>
      </header>
      <section className="lmHero" id="conteudo">
        <div className="lmHeroVisual">
          <ModernPhotoFrame
            photo={modernPhoto(d, "hero")}
            role="hero"
            priority
          />
        </div>
        <div className="lmContainer">
          <div className="lmHeroCopy">
            <h1>{m.headline}</h1>
            <p>
              {d?.heroDescription ||
                "Uma apresentação das informações jurídicas e dos canais de contato, com atenção ao contexto de cada demanda."}
            </p>
            <a className="lmButton" href={heroTarget}>
              {d?.heroPrimaryCta ||
                (enabled("areas") && m.areas.length
                  ? "Conheça nossa atuação"
                  : enabled("about")
                    ? "Conheça o escritório"
                    : "Informações de contato")}
              <ArrowRight size={17} />
            </a>
            <small className="lmDemo">
              Apresentação demonstrativa · fotografia ilustrativa.
            </small>
          </div>
        </div>
      </section>
      {sections.map((id) => blocks[id])}
      <footer id="informacoes" className="lmFooter">
        <div
          className="lmContainer lmFooterGrid"
          data-areas={m.areas.length > 0}
        >
          <div>
            {brand()}
            <p>
              {d?.footerDescription ||
                "Informações institucionais e canais de contato."}
            </p>
            {socials.length > 0 && (
              <div className="lmSocials">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    {...external(s.href)}
                  >
                    <s.icon size={20} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3>Institucional</h3>
            {links.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          {m.areas.length > 0 && (
            <div>
              <h3>Áreas de atuação</h3>
              {m.areas.map((a, i) => (
                <a
                  key={`${a}-${i}`}
                  href={enabled("areas") ? "#atuacao" : destination}
                >
                  {a}
                </a>
              ))}
            </div>
          )}
          <div>
            <h3>Contato</h3>
            {contacts.map((c) => (
              <a
                className="lmFooterContact"
                key={c.id}
                href={c.href}
                {...external(c.href)}
              >
                <c.icon size={17} />
                <span>{c.text}</span>
              </a>
            ))}
            {!contacts.length && (
              <p>Os canais de contato serão apresentados após confirmação.</p>
            )}
          </div>
          <div className="lmLegal">
            <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
            <span>Apresentação institucional · acesso privado.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
