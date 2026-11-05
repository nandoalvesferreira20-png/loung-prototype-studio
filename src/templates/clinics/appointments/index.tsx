import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  HeartPulse,
  Info,
  Instagram,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  PawPrint,
  Phone,
  ShieldPlus,
  Smile,
  Sparkles,
  Stethoscope,
  Activity,
  Brain,
  Globe,
} from "lucide-react";
import type { ClinicModel } from "../shared/adapter";
import { Navigation } from "../shared/navigation";
import {
  appointmentSectionIds,
  appointmentSteps,
  type AppointmentSection,
} from "../../../lib/generation/appointments-design";
import { AppointmentPhotoFrame } from "./photo";
import { appointmentContent, appointmentPhotos } from "./content";

type Contact = {
  id: string;
  label: string;
  value: string;
  href?: string;
  icon: typeof Phone;
};
export function AppointmentsClinic({ model: m }: { model: ClinicModel }) {
  const d = m.design?.appointments;
  const logo = d?.logo !== undefined ? d.logo : m.design?.logo;
  const copy = appointmentContent(m),
    photos = appointmentPhotos(m);
  const fallbackPhotos = appointmentPhotos({ ...m, design: undefined });
  const sections = d?.sections ?? [...appointmentSectionIds];
  const enabled = (id: AppointmentSection) => sections.includes(id);
  const hidden = d?.hiddenContacts ?? [];
  const candidates: Contact[] = [
    ...(m.location
      ? [
          {
            id: "address",
            label: "Localização",
            value: m.location,
            href: m.maps!,
            icon: MapPin,
          },
        ]
      : []),
    ...(m.telephone
      ? [
          {
            id: "phone",
            label: "Telefone",
            value: m.phone!,
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
            value: m.whatsapp!,
            href: m.whatsappUrl,
            icon: MessageCircle,
          },
        ]
      : []),
    ...(d?.email
      ? [
          {
            id: "email",
            label: "E-mail",
            value: d.email,
            href: `mailto:${d.email}`,
            icon: Mail,
          },
        ]
      : []),
    ...(d?.hours
      ? [
          {
            id: "hours",
            label: "Horários confirmados",
            value: d.hours,
            icon: Clock3,
          },
        ]
      : []),
    ...(m.instagramUrl
      ? [
          {
            id: "instagram",
            label: "Instagram",
            value: "Conheça o perfil",
            href: m.instagramUrl,
            icon: Instagram,
          },
        ]
      : []),
    ...(m.websiteUrl
      ? [
          {
            id: "website",
            label: "Site informado",
            value: "Acessar o site",
            href: m.websiteUrl,
            icon: Globe,
          },
        ]
      : []),
  ];
  const contacts = candidates.filter(
    (c) => !hidden.includes(c.id as (typeof hidden)[number]),
  );
  const channels = contacts.filter((c) =>
    ["whatsapp", "phone", "email", "instagram", "website"].includes(c.id),
  );
  const preferred =
    channels.find((c) => c.id === d?.contactChannel) ??
    ["whatsapp", "phone", "email", "instagram", "website"]
      .map((id) => channels.find((c) => c.id === id))
      .find(Boolean);
  const contactHref = preferred?.href ?? "#canais";
  const contactLabel =
    d?.cta ||
    (preferred?.id === "whatsapp"
      ? "Falar pelo WhatsApp"
      : "Entrar em contato");
  const external = (href: string) =>
    /^https?:/.test(href)
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {};
  const contactButton = (label = contactLabel, light = false) => (
    <a
      className={`bButton${light ? " bButtonLight" : ""}`}
      href={contactHref}
      {...external(contactHref)}
    >
      {preferred?.id === "whatsapp" ? (
        <MessageCircle size={18} />
      ) : (
        <CalendarDays size={18} />
      )}
      <span>{label}</span>
    </a>
  );
  const destination = enabled("contact") ? "#contato" : "#canais";
  const links = [
    { href: "#inicio", label: "Início" },
    ...(enabled("services") && m.services.length
      ? [{ href: "#servicos", label: "Especialidades" }]
      : []),
    ...(enabled("about") ? [{ href: "#sobre", label: "Sobre" }] : []),
    ...(enabled("process") ? [{ href: "#como", label: "Como funciona" }] : []),
    { href: destination, label: "Contato" },
  ];
  const SpecialtyIcon = {
    general: Stethoscope,
    dentistry: Smile,
    aesthetics: Sparkles,
    psychology: Brain,
    physiotherapy: Activity,
    veterinary: PawPrint,
  }[m.specialtyId];
  const icons = [
    SpecialtyIcon,
    HeartPulse,
    ShieldPlus,
    Activity,
    Smile,
    Stethoscope,
  ];
  const serviceCard = (service: string, i: number) => {
    const Icon = icons[i % icons.length];
    return (
      <article key={`${service}-${i}`}>
        <span className="bServiceIcon">
          <Icon size={29} strokeWidth={1.6} />
        </span>
        <div>
          <h3>{service}</h3>
          <p>
            {d?.serviceDescriptions?.[service] ||
              m.design?.serviceDescriptions?.[service] ||
              "Consulte informações e disponibilidade deste atendimento diretamente com a clínica."}
          </p>
          <a
            className="bTextLink"
            href={contactHref}
            {...external(contactHref)}
          >
            {d?.servicesCta || "Consultar atendimento"}
            <ArrowRight size={16} />
          </a>
        </div>
      </article>
    );
  };
  const sectionHeading = (
    eyebrow: string,
    title: string,
    description?: string,
  ) => (
    <div className="bSectionHeading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
  const blocks: Record<AppointmentSection, ReactNode> = {
    services: m.services.length ? (
      <section key="services" id="servicos" className="bServices bContainer">
        {sectionHeading(
          "Especialidades",
          d?.servicesTitle ||
            m.design?.servicesTitle ||
            "Encontre o atendimento que você procura",
          d?.servicesDescription ||
            "Conheça os serviços informados pela clínica e entre em contato para saber mais.",
        )}
        <div className="serviceGrid">
          {m.services.slice(0, 6).map(serviceCard)}
        </div>
        {m.services.length > 6 && (
          <details className="bMoreServices">
            <summary>
              Ver mais {m.services.length - 6} atendimentos{" "}
              <ArrowRight size={16} />
            </summary>
            <div className="serviceGrid">
              {m.services.slice(6).map((s, i) => serviceCard(s, i + 6))}
            </div>
          </details>
        )}
      </section>
    ) : (
      <section key="services" className="bServiceEmpty bContainer">
        <span className="eyebrow">Atendimentos · prévia demonstrativa</span>
        <h2>Informações de atendimento</h2>
        <p>Os serviços serão apresentados após confirmação pela clínica.</p>
        <a className="bTextLink" href={contactHref} {...external(contactHref)}>
          Consultar informações <ArrowRight size={16} />
        </a>
      </section>
    ),
    about: (
      <section key="about" id="sobre" className="bAbout bContainer">
        <AppointmentPhotoFrame
          photo={photos.about}
          fallback={fallbackPhotos.about}
          role="about"
        />
        <div>
          <span className="eyebrow">Sobre {m.name}</span>
          <h2>
            {d?.aboutTitle ||
              m.design?.aboutTitle ||
              `Conheça o cuidado de ${m.name}`}
          </h2>
          <p>{copy.about}</p>
          {!m.description && !d?.aboutDescription && (
            <small className="bDemoLabel">
              Conteúdo de demonstração · sujeito à aprovação.
            </small>
          )}
          <a
            className="bButton bButtonOutline"
            href={contactHref}
            {...external(contactHref)}
          >
            {d?.aboutCta || "Saiba mais sobre a clínica"}
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
    ),
    process: (
      <section key="process" id="como" className="bProcess">
        <div className="bContainer">
          {sectionHeading(
            "Como funciona",
            d?.processTitle ||
              "Seu próximo atendimento começa com uma conversa",
            d?.processDescription,
          )}
          <ol>
            {(d?.steps ?? appointmentSteps).map((step, i) => {
              const Icon = [SpecialtyIcon, Phone, CalendarDays][i];
              return (
                <li key={i}>
                  <span className="bStepNumber">0{i + 1}</span>
                  <div>
                    <Icon size={30} strokeWidth={1.6} />
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="bProcessNote">
            Disponibilidade e agendamentos são confirmados diretamente com a
            clínica.
          </p>
        </div>
      </section>
    ),
    gallery: (
      <section key="gallery" id="estrutura" className="bStructure bContainer">
        {sectionHeading(
          "Estrutura e ambiente",
          d?.structureTitle ||
            m.design?.structureTitle ||
            "Conheça referências de espaços de cuidado",
          d?.structureDescription ||
            "Uma seleção visual para esta apresentação. Fotografias ilustrativas não representam instalações ou profissionais da clínica.",
        )}
        {photos.gallery.length > 0 && photos.gallery.some((p) => p.src) ? (
          <div className="bGallery">
            {photos.gallery.map((photo, i) => (
              <AppointmentPhotoFrame
                key={`${photo.src}-${i}`}
                photo={photo}
                fallback={
                  fallbackPhotos.gallery[i % fallbackPhotos.gallery.length]
                }
                role="gallery"
              />
            ))}
          </div>
        ) : (
          <p className="bGalleryNotice">
            Selecione no painel imagens compatíveis com{" "}
            {m.specialty || "a clínica"} para compor a galeria.
          </p>
        )}
      </section>
    ),
    conversion: (
      <section key="conversion" className="bConversion">
        <div className="bContainer">
          <div>
            <h2>
              {d?.conversionTitle ||
                m.design?.contactTitle ||
                (m.specialtyId === "veterinary"
                  ? "O primeiro passo para cuidar do seu pet começa aqui."
                  : "O primeiro passo para o seu cuidado começa aqui.")}
            </h2>
            <p>
              {d?.conversionDescription ||
                "Tire suas dúvidas e consulte informações diretamente com a clínica."}
            </p>
          </div>
          {contactButton(d?.conversionCta || contactLabel, true)}
        </div>
      </section>
    ),
    contact: (
      <section key="contact" id="contato" className="bContact bContainer">
        {sectionHeading(
          "Contato",
          d?.contactTitle || `Fale com ${m.name}`,
          d?.contactDescription ||
            "Escolha o melhor canal para conversar e consultar informações de atendimento.",
        )}
        {contacts.length ? (
          <div className="bContactGrid">
            {contacts.map((c) => (
              <article
                key={c.id}
                id={c.id === "address" ? "localizacao" : undefined}
              >
                <c.icon size={25} strokeWidth={1.7} />
                <div>
                  <h3>{c.label}</h3>
                  {c.href ? (
                    <a href={c.href} {...external(c.href)}>
                      {c.value}
                    </a>
                  ) : (
                    <p>{c.value}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="bNoContact">
            Os canais de contato serão apresentados após confirmação.
          </p>
        )}
      </section>
    ),
  };
  return (
    <main
      className="clinic appointments appointmentsV2"
      id="inicio"
      data-template="clinicas-b"
      style={
        {
          "--b-primary": d?.primary ?? m.design?.primary ?? "#004D50",
          "--b-secondary": d?.secondary ?? "#B8DDD6",
          "--b-button": d?.button ?? m.design?.button ?? "#004D50",
        } as CSSProperties
      }
    >
      <a className="skipLink" href="#conteudo">
        Ir ao conteúdo
      </a>
      <header className="bHeader bContainer">
        <a className="identity bIdentity" href="#inicio">
          {logo ? (
            <Image
              src={logo}
              alt={`Logotipo de ${m.name}`}
              width={43}
              height={43}
            />
          ) : (
            <Leaf size={39} strokeWidth={1.5} />
          )}
          <span>
            <strong>{m.name}</strong>
            <small>
              {d?.subtitle ||
                m.design?.subtitle ||
                m.specialty ||
                "Saúde e bem-estar"}
            </small>
          </span>
        </a>
        <Navigation links={links} />
        <div className="bHeaderCta">{contactButton()}</div>
      </header>
      <section id="conteudo" className="bHero">
        <div className="bHeroCopy">
          <span className="eyebrow">
            {m.specialty ??
              (m.specialtyId === "veterinary"
                ? "Cuidado animal"
                : "Saúde e bem-estar")}
          </span>
          <h1>{copy.headline}</h1>
          <p>{copy.description}</p>
          <div className="bHeroActions">
            {contactButton()}
            {enabled("about") && (
              <a className="bButton bButtonOutline" href="#sobre">
                {d?.secondaryCta || "Conheça a clínica"}
              </a>
            )}
          </div>
          <small className="bDemoLabel">
            Conteúdo de demonstração · apresentação conceitual.
          </small>
        </div>
        <div className="bHeroVisual">
          <AppointmentPhotoFrame
            photo={photos.hero}
            fallback={fallbackPhotos.hero}
            role="hero"
            priority
          />
          <div className="bFloatingLinks">
            <a href={destination}>
              <MessageCircle />
              <span>
                Contato
                <br />
                com a clínica
              </span>
            </a>
            {m.services.length > 0 && enabled("services") && (
              <a href="#servicos">
                <SpecialtyIcon />
                <span>
                  Conheça os
                  <br />
                  atendimentos
                </span>
              </a>
            )}
            {enabled("process") && (
              <a href="#como">
                <CalendarDays />
                <span>
                  Consulte como
                  <br />
                  entrar em contato
                </span>
              </a>
            )}
          </div>
        </div>
      </section>
      <nav className="bInfoBar bContainer" aria-label="Informações da clínica">
        {[
          {
            href: destination,
            icon: Phone,
            title: "Contato facilitado",
            text: "Encontre os canais informados.",
          },
          {
            href:
              enabled("services") && m.services.length
                ? "#servicos"
                : enabled("process")
                  ? "#como"
                  : destination,
            icon: SpecialtyIcon,
            title: "Atendimentos",
            text: "Consulte informações com a clínica.",
          },
          {
            href:
              contacts.some((c) => c.id === "address") && enabled("contact")
                ? "#localizacao"
                : destination,
            icon: MapPin,
            title: contacts.some((c) => c.id === "address")
              ? "Localização"
              : "Informações de contato",
            text: contacts.some((c) => c.id === "address")
              ? [m.city, m.state].filter(Boolean).join(" / ") ||
                "Veja como encontrar a clínica."
              : "Escolha o canal que preferir.",
          },
          {
            href: enabled("about") ? "#sobre" : destination,
            icon: Info,
            title: "Informações da clínica",
            text: "Conheça esta apresentação.",
          },
        ].map((item) => (
          <a key={item.title} href={item.href}>
            <item.icon size={28} strokeWidth={1.6} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </span>
          </a>
        ))}
      </nav>
      {sections.map((id) => blocks[id])}
      <footer className="bFooter" id="canais">
        <div
          className="bContainer bFooterGrid"
          data-social={channels.some(
            (c) => c.id === "instagram" || c.id === "website",
          )}
        >
          <div>
            <a className="bIdentity" href="#inicio">
              {logo ? (
                <Image
                  src={logo}
                  alt={`Logotipo de ${m.name}`}
                  width={35}
                  height={35}
                />
              ) : (
                <Leaf size={35} />
              )}
              <strong>{m.name}</strong>
            </a>
            <p>
              {d?.footerDescription ||
                m.specialty ||
                "Consulte informações sobre a clínica e seus canais de contato."}
            </p>
          </div>
          <div>
            <h3>Navegação</h3>
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
          <div>
            <h3>Contato</h3>
            {contacts.length ? (
              contacts.map((c) => (
                <div
                  className="bFooterContact"
                  key={c.id}
                  id={
                    !enabled("contact") && c.id === "address"
                      ? "localizacao"
                      : undefined
                  }
                >
                  <c.icon size={17} />
                  {c.href ? (
                    <a href={c.href} {...external(c.href)}>
                      {c.value}
                    </a>
                  ) : (
                    <span>{c.value}</span>
                  )}
                </div>
              ))
            ) : (
              <p>Os canais de contato serão apresentados após confirmação.</p>
            )}
          </div>
          {channels.some((c) => c.id === "instagram" || c.id === "website") && (
            <div>
              <h3>Acompanhe a clínica</h3>
              <div className="bSocialLinks">
                {channels
                  .filter((c) => c.id === "instagram" || c.id === "website")
                  .map((c) => (
                    <a
                      key={c.id}
                      href={c.href}
                      aria-label={c.label}
                      {...external(c.href!)}
                    >
                      <c.icon size={23} />
                    </a>
                  ))}
              </div>
            </div>
          )}
          <div className="bFooterLegal">
            <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
            <a href="#inicio">Voltar ao início ↑</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
