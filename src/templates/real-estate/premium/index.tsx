"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import {
  Building2,
  ArrowRight,
  Phone,
  MapPin,
  Mail,
  MessageCircle,
  Maximize,
  BedDouble,
  Bath,
  Car,
  Search,
  CalendarDays,
  UserRound,
} from "lucide-react";
import { Navigation } from "../../clinics/shared/navigation";
import {
  estateColors,
  estateSections,
  propertyTypeLabels,
  type EstateProperty,
  type EstateSection,
} from "../../../lib/generation/real-estate-design";
import type { EstateModel } from "./model";
import { estatePhotos } from "./photography";
import { EstatePhotoFrame } from "./photo";
import {
  emptyFilters,
  filterProperties,
  propertyPrice,
  type PropertyFilters,
} from "./catalog";
function Features({ p }: { p: EstateProperty }) {
  return (
    <div className="reFeatures">
      {p.area != null && (
        <span>
          <Maximize />
          {p.area.toLocaleString("pt-BR")} m²
        </span>
      )}
      {p.bedrooms != null && (
        <span>
          <BedDouble />
          {p.bedrooms} dorm.
        </span>
      )}
      {p.bathrooms != null && (
        <span>
          <Bath />
          {p.bathrooms} banh.
        </span>
      )}
      {p.parking != null && (
        <span>
          <Car />
          {p.parking} vagas
        </span>
      )}
    </div>
  );
}
function PropertyDialog({
  p,
  onClose,
  contact,
}: {
  p: EstateProperty | null;
  onClose: () => void;
  contact: string | null;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (p) ref.current?.showModal();
    else ref.current?.close();
  }, [p]);
  return (
    <dialog
      ref={ref}
      className="reDialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={p?.title || "Detalhes do imóvel"}
    >
      {p && (
        <>
          <button
            className="reClose"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            Fechar ×
          </button>
          <div className="reGallery">
            {p.images
              .filter((i) => i.src)
              .map((photo, i) => (
                <EstatePhotoFrame
                  key={i}
                  photo={photo}
                  illustrative={p.demonstration}
                />
              ))}
          </div>
          <div className="reDialogContent">
            {p.demonstration && (
              <strong className="reDemo">
                Demonstração — anúncio fictício, indisponível para negociação
              </strong>
            )}
            <p>
              {p.purpose === "venda" ? "Venda" : "Locação"} · {p.status}
            </p>
            <h2>{p.title}</h2>
            <p>
              {[p.address, p.neighborhood, p.city].filter(Boolean).join(" · ")}
            </p>
            <Features p={p} />
            {propertyPrice(p) && <h3>{propertyPrice(p)}</h3>}
            <p>{p.description}</p>
            {p.additional && <p>{p.additional}</p>}
            {contact && !p.demonstration && (
              <a className="reButton" href={contact}>
                Falar com o corretor <ArrowRight />
              </a>
            )}
          </div>
        </>
      )}
    </dialog>
  );
}
export function PremiumEstate({ model: m }: { model: EstateModel }) {
  const c = m.confirmed,
    d = m.design,
    solo = d?.leadType === "broker";
  const enabled = d?.sections ?? estateSections;
  const has = (s: EstateSection) => enabled.includes(s);
  const properties = (d?.properties ?? []).filter(
    (p) => p.status !== "inativo",
  );
  const hasCatalog = has("properties") && properties.length > 0;
  const contact =
    m.whatsapp ||
    m.telephone ||
    (d?.email ? `mailto:${d.email}` : null) ||
    c.website ||
    c.instagram ||
    null;
  const contactTarget = has("contact") ? "#contato" : "#informacoes";
  const [draft, setDraft] = useState<PropertyFilters>(emptyFilters),
    [filters, setFilters] = useState<PropertyFilters>(emptyFilters),
    [selected, setSelected] = useState<EstateProperty | null>(null);
  const results = filterProperties(properties, filters);
  const categories = Array.from(new Set(properties.map((p) => p.type))).filter(
    (type) => !d?.categories?.find((v) => v.type === type)?.hidden,
  );
  const photo = (slot: keyof typeof estatePhotos) =>
    d?.images?.[slot] ?? estatePhotos[slot];
  const link = (text: string, href: string, outline = false) => (
    <a className={`reButton${outline ? " reOutline" : ""}`} href={href}>
      {text}
      <ArrowRight size={16} />
    </a>
  );
  const brand = (
    <a href="#inicio" className="reBrand">
      {d?.logo ? (
        <Image src={d.logo} alt="" width={58} height={48} />
      ) : (
        d?.brandMark !== "none" &&
        (d?.brandMark === "monogram" ? (
          <span className="reMonogram">{m.monogram}</span>
        ) : (
          <Building2 aria-hidden="true" />
        ))
      )}
      <span>
        <strong>{c.name}</strong>
        <small>
          {d?.professionalLabel || (solo ? "Corretor de imóveis" : "Imóveis")}
        </small>
      </span>
    </a>
  );
  const nav = [
    { href: "#inicio", label: "Início" },
    ...(hasCatalog ? [{ href: "#imoveis", label: "Imóveis" }] : []),
    ...(has("about")
      ? [{ href: "#sobre", label: solo ? "Sobre mim" : "Sobre nós" }]
      : []),
    ...(has("services") && c.services.length
      ? [{ href: "#servicos", label: "Serviços" }]
      : []),
    ...(has("contact") ? [{ href: "#contato", label: "Contato" }] : []),
  ];
  const chooseCategory = (type: string) => {
    const next = { ...emptyFilters, type };
    setDraft(next);
    setFilters(next);
  };
  const sections: Record<EstateSection, React.ReactNode> = {
    properties: (
      <section id="imoveis" className="reContainer reCatalog" key="properties">
        <header className="reCentered">
          <h2>{d?.propertiesTitle || "Imóveis selecionados para você."}</h2>
          <p>
            {d?.propertiesDescription ||
              "Explore as informações dos imóveis cadastrados e encontre novas possibilidades."}
          </p>
          <i />
        </header>
        {properties.length ? (
          <>
            <p className="reResult" aria-live="polite">
              {results.length}{" "}
              {results.length === 1
                ? "imóvel encontrado"
                : "imóveis encontrados"}
            </p>
            <div className="rePropertyGrid">
              {results.map((p) => (
                <article className="reProperty" key={p.id}>
                  <div className="rePropertyVisual">
                    <EstatePhotoFrame
                      photo={p.images[0] ?? { src: null }}
                      illustrative={p.demonstration}
                    />
                    <span className="reBadge">
                      {p.demonstration
                        ? "Demonstração"
                        : p.purpose === "venda"
                          ? "Venda"
                          : "Locação"}
                    </span>
                    {p.featured && <span className="reFeatured">Destaque</span>}
                  </div>
                  <div className="rePropertyBody">
                    <h3>{p.title}</h3>
                    {p.demonstration && (
                      <p className="reDemo">
                        Exemplo fictício · não disponível
                      </p>
                    )}
                    {(p.city || p.neighborhood) && (
                      <p className="reLocation">
                        <MapPin />
                        {[p.neighborhood, p.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {p.status !== "disponivel" && (
                      <p className="reStatus">{p.status}</p>
                    )}
                    <Features p={p} />
                    <div className="rePropertyBottom">
                      {propertyPrice(p) && <strong>{propertyPrice(p)}</strong>}
                      <button onClick={() => setSelected(p)}>
                        Ver detalhes <ArrowRight />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!results.length && (
              <div className="reEmpty">
                <h3>Nenhum imóvel para estes filtros.</h3>
                <p>Ajuste a busca ou consulte os canais de contato.</p>
                <button
                  className="reButton"
                  onClick={() => {
                    setDraft(emptyFilters);
                    setFilters(emptyFilters);
                  }}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="reEmpty reEmptySplit">
            <EstatePhotoFrame photo={estatePhotos.editorial} />
            <div>
              <span className="reEyebrow">Catálogo ainda não cadastrado</span>
              <h3>
                {d?.emptyTitle ||
                  "Novas possibilidades começam com uma conversa."}
              </h3>
              <p>
                {d?.emptyDescription ||
                  "Este protótipo ainda não contém anúncios. A fotografia é uma referência visual e não representa imóvel disponível."}
              </p>
              {link(
                contact ? "Entre em contato" : "Informações disponíveis",
                contact || contactTarget,
              )}
            </div>
          </div>
        )}
      </section>
    ),
    about: (
      <section id="sobre" key="about" className="reAbout reContainer">
        <EstatePhotoFrame photo={photo("about")} />
        <div>
          <span className="reEyebrow">
            {solo ? "Apresentação" : "Sobre"} · {c.name}
          </span>
          <h2>
            {d?.aboutTitle ||
              "Mais do que imóveis. Conexões com novos começos."}
          </h2>
          <p>
            {d?.aboutDescription ||
              c.description ||
              `Conheça ${c.name} e os canais disponíveis para conversar sobre seus planos imobiliários.`}
          </p>
          {d?.creci && <p>CRECI: {d.creci}</p>}
          {link(
            d?.aboutCta ||
              (solo ? "Converse comigo" : "Conheça nosso atendimento"),
            contact || contactTarget,
          )}
        </div>
      </section>
    ),
    categories:
      hasCatalog && categories.length ? (
        <section className="reContainer reCategories" key="categories">
          <header>
            <h2>{d?.categoriesTitle || "Encontre por categoria"}</h2>
            <p>
              {d?.categoriesDescription ||
                "Descubra os tipos de imóveis presentes no catálogo."}
            </p>
          </header>
          <div>
            {categories.map((type) => {
              const custom = d?.categories?.find((v) => v.type === type);
              const p = properties.find((p) => p.type === type)!;
              return (
                <a
                  href="#imoveis"
                  key={type}
                  onClick={() => chooseCategory(type)}
                >
                  <EstatePhotoFrame
                    photo={custom?.image ?? p.images[0] ?? { src: null }}
                    illustrative={!!custom?.image || p.demonstration}
                  />
                  <span>
                    {propertyTypeLabels[type]} <ArrowRight />
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      ) : null,
    steps: (
      <section key="steps" className="reSteps">
        <div className="reContainer">
          <h2>
            {d?.stepsTitle || "Cada imóvel representa uma nova possibilidade."}
          </h2>
          {(
            d?.steps ?? [
              {
                title: "Descubra oportunidades.",
                description: "Explore as informações e os imóveis cadastrados.",
              },
              {
                title: "Consulte sobre visitas.",
                description:
                  "Converse sobre as possibilidades de conhecer um imóvel.",
              },
              {
                title: solo
                  ? "Converse comigo."
                  : "Converse com um profissional.",
                description:
                  "Compartilhe suas dúvidas pelos canais disponíveis.",
              },
            ]
          ).map((step, i) => {
            const Icon = [Search, CalendarDays, UserRound][i];
            return (
              <div key={i}>
                <span>
                  <Icon /> {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    ),
    services: c.services.length ? (
      <section key="services" id="servicos" className="reContainer reServices">
        <span className="reEyebrow">Atendimento</span>
        <h2>{d?.servicesTitle || "Como podemos ajudar"}</h2>
        <ul>
          {c.services.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    ) : null,
    editorial: (
      <section className="reEditorial" key="editorial">
        <EstatePhotoFrame photo={photo("editorial")} />
        <div>
          <h2>
            {d?.editorialTitle || "Espaços que inspiram novas histórias."}
          </h2>
          <i />
          <p>
            {d?.editorialDescription ||
              "Arquitetura, conforto e localização fazem parte de cada escolha. Converse sobre o que importa para o seu próximo passo."}
          </p>
          {link(
            d?.editorialCta ||
              (hasCatalog
                ? "Conheça os imóveis"
                : "Converse sobre seus planos"),
            hasCatalog ? "#imoveis" : contact || contactTarget,
          )}
        </div>
      </section>
    ),
    conversion: (
      <section className="reConversion" key="conversion">
        <div className="reContainer">
          <div>
            <h2>
              {d?.conversionTitle ||
                "O imóvel ideal pode estar mais perto do que você imagina."}
            </h2>
            <p>
              {d?.conversionDescription ||
                "Entre em contato para conversar sobre seus planos."}
            </p>
          </div>
          {contact &&
            link(
              d?.conversionCta ||
                (m.whatsapp ? "Conversar no WhatsApp" : "Entre em contato"),
              contact,
            )}
        </div>
      </section>
    ),
    contact: (
      <section id="contato" className="reContact reContainer" key="contact">
        <div>
          <h2>{d?.contactTitle || "Vamos encontrar seu próximo imóvel?"}</h2>
          <i />
          <p>
            {d?.contactDescription ||
              (solo
                ? "Fale comigo e compartilhe seus planos."
                : "Fale com a equipe e compartilhe seus planos.")}
          </p>
          {contact &&
            link(
              d?.contactCta || (solo ? "Fale comigo" : "Fale conosco"),
              contact,
            )}
        </div>
        <address>
          {m.telephone && (
            <a href={m.telephone}>
              <Phone />
              <span>
                <b>Telefone</b>
                {c.phone}
              </span>
            </a>
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
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`}
            >
              <MapPin />
              <span>
                <b>Localização</b>
                {m.location}
              </span>
            </a>
          )}
          {!contact && !m.location && (
            <p>Dados de contato ainda não informados.</p>
          )}
        </address>
        <EstatePhotoFrame photo={photo("contact")} />
      </section>
    ),
  };
  return (
    <div
      className={`estatePremium reFont-${d?.typeface || "editorial"}`}
      id="inicio"
      style={
        Object.fromEntries(
          Object.entries({ ...estateColors, ...d?.colors }).map(([k, v]) => [
            `--re-${k}`,
            v,
          ]),
        ) as CSSProperties
      }
    >
      <header className="reHeader">
        <div className="reContainer">
          {brand}
          <Navigation links={nav} />
          {link(
            contact
              ? d?.heroSecondaryCta ||
                  (solo ? "Fale comigo" : "Fale com um corretor")
              : "Informações",
            contact || contactTarget,
          )}
        </div>
      </header>
      <main>
        <section className="reHero">
          <EstatePhotoFrame photo={photo("hero")} hero />
          <div className="reContainer">
            <div className="reHeroCopy">
              <i />
              <h1>
                {d?.heroTitle ||
                  "Encontre o lugar onde sua próxima história começa."}
              </h1>
              <p>
                {d?.heroDescription ||
                  "Conheça possibilidades e converse sobre os espaços que combinam com seus planos."}
              </p>
              <div>
                {link(
                  d?.heroPrimaryCta ||
                    (hasCatalog ? "Explorar imóveis" : "Conheça o atendimento"),
                  hasCatalog
                    ? "#imoveis"
                    : has("about")
                      ? "#sobre"
                      : contactTarget,
                )}
                {link(
                  d?.heroSecondaryCta ||
                    (solo ? "Fale comigo" : "Falar com um corretor"),
                  contact || contactTarget,
                  true,
                )}
              </div>
            </div>
          </div>
        </section>
        {hasCatalog && (
          <form
            className="reSearch reContainer"
            onSubmit={(e) => {
              e.preventDefault();
              setFilters({ ...draft });
              document
                .getElementById("imoveis")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label>
              Finalidade
              <select
                value={draft.purpose}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    purpose: e.target.value as PropertyFilters["purpose"],
                  })
                }
              >
                <option value="">Comprar ou alugar</option>
                <option value="venda">Comprar</option>
                <option value="locacao">Alugar</option>
              </select>
            </label>
            <label>
              Tipo de imóvel
              <select
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value })}
              >
                <option value="">Todos os tipos</option>
                {categories.map((t) => (
                  <option key={t} value={t}>
                    {propertyTypeLabels[t]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Localização
              <input
                value={draft.location}
                onChange={(e) =>
                  setDraft({ ...draft, location: e.target.value })
                }
                placeholder="Cidade ou bairro"
                maxLength={160}
              />
            </label>
            <label>
              Faixa de preço
              <select
                value={draft.price}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    price: e.target.value as PropertyFilters["price"],
                  })
                }
              >
                <option value="">Qualquer valor</option>
                <option value="under500">Até R$ 500 mil</option>
                <option value="500to1m">R$ 500 mil a 1 milhão</option>
                <option value="1to3m">R$ 1 a 3 milhões</option>
                <option value="over3m">Acima de R$ 3 milhões</option>
              </select>
            </label>
            <button className="reButton" type="submit">
              <Search />
              Buscar imóveis
            </button>
          </form>
        )}
        {enabled.map((s) => sections[s])}
      </main>
      <footer className="reFooter" id="informacoes">
        <div className="reContainer reFooterGrid">
          <div>
            {brand}
            <p>
              {d?.footerDescription || `Informações e contato de ${c.name}.`}
            </p>
            {d?.creci && <p>CRECI: {d.creci}</p>}
            <div className="reSocials">
              {c.instagram && <a href={c.instagram}>Instagram</a>}
              {d?.facebook && <a href={d.facebook}>Facebook</a>}
              {c.website && <a href={c.website}>Website</a>}
            </div>
          </div>
          <div>
            <h3>Navegação</h3>
            {nav.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          {hasCatalog && categories.length > 0 && (
            <div>
              <h3>Categorias de imóveis</h3>
              {categories.map((t) => (
                <a href="#imoveis" onClick={() => chooseCategory(t)} key={t}>
                  {propertyTypeLabels[t]}
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
            {!contact && !m.location && <p>Contato ainda não informado.</p>}
          </div>
        </div>
        <div className="reContainer reCredit">
          <span>
            © {new Date().getFullYear()} {c.name}
          </span>
          <span>Protótipo demonstrativo desenvolvido pela Loung Tech.</span>
        </div>
      </footer>
      <PropertyDialog
        p={selected}
        onClose={() => setSelected(null)}
        contact={contact}
      />
    </div>
  );
}
