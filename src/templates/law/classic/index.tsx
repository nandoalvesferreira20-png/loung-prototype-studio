import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FileText,
  Handshake,
  House,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Scale,
  Users,
  MessageCircle,
  Globe,
} from "lucide-react";
import { Navigation } from "../../clinics/shared/navigation";
import {
  lawSections,
  type LawSection,
} from "../../../lib/generation/law-design";
import { lawMonogram, type LawModel } from "./model";
import { LawPhotoFrame } from "./photo";
import { resolveLawPhoto } from "./photography";
const icons = {
  scale: Scale,
  building: Building2,
  briefcase: BriefcaseBusiness,
  home: House,
  users: Users,
  file: FileText,
  handshake: Handshake,
  book: BookOpen,
};
export function ClassicLaw({ model: m }: { model: LawModel }) {
  const d = m.design,
    sections = d?.sections ?? [...lawSections];
  const enabled = (id: LawSection) => sections.includes(id);
  const contactHref =
    m.whatsappUrl ??
    m.telephone ??
    (d?.email
      ? `mailto:${d.email}`
      : (m.instagramUrl ?? d?.linkedin ?? m.websiteUrl ?? "#informacoes"));
  const external = (href: string) =>
    /^https?:/.test(href)
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
  const contactTarget = enabled("contact") ? "#contato" : "#informacoes";
  const aboutLabel = m.solo ? "Apresentação" : "O Escritório";
  const links = [
    { href: "#inicio", label: "Início" },
    ...(enabled("about") ? [{ href: "#escritorio", label: aboutLabel }] : []),
    ...(enabled("areas") && m.areas.length
      ? [{ href: "#atuacao", label: "Áreas de Atuação" }]
      : []),
    ...(enabled("team") && m.team.length
      ? [
          {
            href: "#equipe",
            label: m.solo ? "Perfil profissional" : "Nossa Equipe",
          },
        ]
      : []),
    { href: contactTarget, label: "Contato" },
  ];
  const identity = (footer = false) => (
    <a
      href="#inicio"
      className={`lawIdentity${footer ? " lawIdentityFooter" : ""}`}
    >
      {d?.logo ? (
        <Image
          src={d.logo}
          alt={`Logotipo de ${m.name}`}
          width={54}
          height={48}
        />
      ) : (
        <span
          className="lawMonogram"
          aria-label="Monograma tipográfico demonstrativo"
        >
          {m.monogram}
        </span>
      )}
      <span className="lawBrand">
        <strong>{m.name}</strong>
        <small>
          {d?.professionalLabel || m.specialty || "Informações institucionais"}
        </small>
      </span>
    </a>
  );
  const contacts = [
    ...(m.location
      ? [
          {
            label: "Localização",
            text: m.location,
            href: m.maps!,
            icon: MapPin,
          },
        ]
      : []),
    ...(m.telephone
      ? [{ label: "Telefone", text: m.phone!, href: m.telephone, icon: Phone }]
      : []),
    ...(d?.email
      ? [
          {
            label: "E-mail",
            text: d.email,
            href: `mailto:${d.email}`,
            icon: Mail,
          },
        ]
      : []),
    ...(m.whatsappUrl
      ? [
          {
            label: "WhatsApp",
            text: m.whatsapp!,
            href: m.whatsappUrl,
            icon: MessageCircle,
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
  const card = (area: string, i: number) => {
    const details = d?.areaDetails?.[area],
      Icon = icons[details?.icon ?? "scale"];
    return (
      <article key={`${area}-${i}`}>
        <Icon size={32} strokeWidth={1.3} />
        <h3>{area}</h3>
        <p>
          {details?.description ||
            "Consulte informações sobre esta área de atuação pelos canais disponíveis."}
        </p>
        <a href={contactHref} {...external(contactHref)}>
          {d?.areasCta || "Saiba mais"}
          <ArrowRight size={16} />
        </a>
      </article>
    );
  };
  const blocks: Record<LawSection, ReactNode> = {
    about: (
      <section id="escritorio" key="about" className="lawAbout lawContainer">
        <LawPhotoFrame photo={resolveLawPhoto(d, "about")} role="about" />
        <div>
          <span className="lawKicker">
            {m.solo ? "Apresentação profissional" : "Nosso escritório"}
          </span>
          <h2>
            {d?.aboutTitle ||
              (m.solo ? `Conheça a atuação de ${m.name}` : `Conheça ${m.name}`)}
          </h2>
          <p>{m.about}</p>
          {!m.description && !d?.aboutDescription && (
            <small className="lawDemo">
              Conteúdo de demonstração · apresentação sujeita à aprovação.
            </small>
          )}
          <a
            className="lawButton"
            href={
              enabled("areas") && m.areas.length ? "#atuacao" : contactTarget
            }
          >
            {d?.aboutCta || "Conheça nossa atuação"}
          </a>
        </div>
      </section>
    ),
    areas: m.areas.length ? (
      <section id="atuacao" key="areas" className="lawAreas lawContainer">
        <span className="lawHeadingRule" />
        <h2>
          {d?.areasTitle ||
            "Informações jurídicas para diferentes necessidades."}
        </h2>
        {d?.areasDescription && (
          <p className="lawSectionIntro">{d.areasDescription}</p>
        )}
        <div className="lawAreaGrid" data-columns={Math.min(m.areas.length, 3)}>
          {m.areas.slice(0, 6).map(card)}
        </div>
        {m.areas.length > 6 && (
          <details className="lawMore">
            <summary>
              Outras áreas de atuação <ArrowRight size={16} />
            </summary>
            <div
              className="lawAreaGrid"
              data-columns={Math.min(m.areas.length - 6, 3)}
            >
              {m.areas.slice(6).map((a, i) => card(a, i + 6))}
            </div>
          </details>
        )}
      </section>
    ) : null,
    editorial: (
      <section className="lawEditorial" key="editorial">
        <div className="lawEditorialVisual">
          <LawPhotoFrame
            photo={resolveLawPhoto(d, "editorial")}
            role="editorial"
          />
        </div>
        <div className="lawContainer lawEditorialContent">
          <div>
            <span className="lawHeadingRule" />
            <h2>
              {d?.editorialTitle ||
                "Informação, responsabilidade e atenção a cada detalhe."}
            </h2>
          </div>
          <p>
            {d?.editorialDescription ||
              "Conheça as áreas de atuação informadas e entre em contato para esclarecer dúvidas sobre o atendimento. Cada demanda deve ser compreendida em seu contexto, sem antecipar resultados."}
          </p>
        </div>
      </section>
    ),
    team: m.team.length ? (
      <section id="equipe" className="lawTeam lawContainer" key="team">
        <span className="lawKicker">
          {m.solo ? "Perfil profissional" : "Nossa equipe"}
        </span>
        <h2>
          {d?.teamTitle ||
            (m.solo
              ? "Conheça o perfil profissional."
              : "Conheça os profissionais apresentados pelo escritório.")}
        </h2>
        <div className="lawTeamGrid" data-single={m.team.length === 1}>
          {m.team.map((person, i) => (
            <article key={`${person.name}-${i}`}>
              {person.photo ? (
                <LawPhotoFrame
                  role="team"
                  photo={{
                    src: person.photo,
                    caption: person.name,
                    illustrative: false,
                  }}
                />
              ) : (
                <div className="lawTeamInitials" aria-hidden="true">
                  {lawMonogram(person.name)}
                </div>
              )}
              <div>
                <h3>{person.name}</h3>
                {person.role && <p>{person.role}</p>}
                {person.area && <p className="lawTeamArea">{person.area}</p>}
                {person.registration && <p>{person.registration}</p>}
                {person.description && <p>{person.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    ) : null,
    contact: (
      <section id="contato" className="lawContact lawContainer" key="contact">
        <div>
          <span className="lawKicker">Contato</span>
          <h2>
            {d?.contactTitle || "Informações para compreender o próximo passo."}
          </h2>
          <p>
            {d?.contactDescription ||
              "Utilize os canais informados para conversar sobre sua necessidade e obter informações sobre o atendimento."}
          </p>
          <div className="lawContactList">
            {contacts.map((c) => (
              <a key={c.label} href={c.href} {...external(c.href)}>
                <c.icon size={25} strokeWidth={1.4} />
                <span>
                  <strong>{c.label}</strong>
                  <span>{c.text}</span>
                </span>
              </a>
            ))}
            {!contacts.length && (
              <p>Os canais de contato serão apresentados após confirmação.</p>
            )}
          </div>
          <a
            className="lawButton"
            href={contactHref}
            {...external(contactHref)}
          >
            {d?.contactCta || "Entre em contato"}
          </a>
        </div>
        <LawPhotoFrame photo={resolveLawPhoto(d, "contact")} role="contact" />
      </section>
    ),
  };
  const defaults = [
    {
      title: m.solo ? "Apresentação profissional" : "Conheça o escritório",
      icon: "handshake" as const,
      target: "about" as const,
    },
    {
      title: m.areas.length ? "Áreas de atuação" : "Informações institucionais",
      icon: "users" as const,
      target: m.areas.length ? ("areas" as const) : ("about" as const),
    },
    {
      title: "Informações de contato",
      icon: "scale" as const,
      target: "contact" as const,
    },
  ];
  return (
    <main
      className="lawTemplate"
      data-template="advocacia-a"
      id="inicio"
      data-typeface={d?.typeface ?? "editorial"}
      style={
        {
          "--law-primary": d?.colors?.primary,
          "--law-secondary": d?.colors?.secondary,
          "--law-paper": d?.colors?.paper,
          "--law-accent": d?.colors?.accent,
          "--law-text": d?.colors?.text,
          "--law-muted": d?.colors?.muted,
        } as CSSProperties
      }
    >
      <a className="lawSkip" href="#conteudo">
        Ir ao conteúdo
      </a>
      <header className="lawHeader">
        <div className="lawContainer">
          {identity()}
          <Navigation links={links} />
          <a className="lawButton lawButtonHeader" href={contactTarget}>
            {d?.contactCta || "Entre em contato"}
          </a>
        </div>
      </header>
      <section id="conteudo" className="lawHero">
        <div className="lawHeroVisual">
          <LawPhotoFrame
            photo={resolveLawPhoto(d, "hero")}
            role="hero"
            priority
          />
        </div>
        <div className="lawContainer">
          <div className="lawHeroCopy">
            <h1>{m.headline}</h1>
            <span className="lawHeadingRule" />
            <p>
              {d?.heroDescription ||
                `Informações sobre ${m.name}, sua atuação e os canais disponíveis para contato.`}
            </p>
            <div className="lawHeroActions">
              <a
                className="lawButton"
                href={enabled("about") ? "#escritorio" : contactTarget}
              >
                {d?.heroPrimaryCta ||
                  (enabled("about")
                    ? m.solo
                      ? "Conheça a apresentação"
                      : "Conheça o Escritório"
                    : "Informações de contato")}
              </a>
              {enabled("areas") && m.areas.length > 0 && (
                <a className="lawButton lawButtonOutline" href="#atuacao">
                  {d?.heroSecondaryCta || "Áreas de Atuação"}
                </a>
              )}
            </div>
            <small className="lawDemo">
              Apresentação demonstrativa · imagens ilustrativas.
            </small>
          </div>
        </div>
      </section>
      {d?.showFeatures !== false && (d?.features ?? defaults).length > 0 && (
        <nav className="lawFeatures" aria-label="Explore a apresentação">
          <div className="lawContainer">
            {(d?.features ?? defaults).map((f, i) => {
              const Icon = icons[f.icon];
              const href =
                f.target === "about" && enabled("about")
                  ? "#escritorio"
                  : f.target === "areas" && enabled("areas") && m.areas.length
                    ? "#atuacao"
                    : contactTarget;
              return (
                <a key={i} href={href}>
                  <Icon size={37} strokeWidth={1.2} />
                  <span>{f.title}</span>
                </a>
              );
            })}
          </div>
        </nav>
      )}
      {sections.map((id) => blocks[id])}
      <footer id="informacoes" className="lawFooter">
        <div
          className="lawContainer lawFooterGrid"
          data-areas={m.areas.length > 0}
        >
          <div>
            {identity(true)}
            <span className="lawHeadingRule" />
            <p>
              {d?.footerDescription ||
                "Informações institucionais e canais de contato."}
            </p>
            {socials.length > 0 && (
              <div className="lawSocials">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    {...external(s.href)}
                  >
                    <s.icon size={19} />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3>Navegação</h3>
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          {m.areas.length > 0 && (
            <div>
              <h3>Áreas de atuação</h3>
              {m.areas.map((a, i) => (
                <a
                  key={`${a}-${i}`}
                  href={enabled("areas") ? "#atuacao" : contactTarget}
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
                className="lawFooterContact"
                key={c.label}
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
          <div className="lawLegal">
            <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
            <span>Apresentação institucional · acesso privado.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
