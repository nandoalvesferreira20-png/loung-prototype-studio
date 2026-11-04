"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Blocks, Check, LayoutTemplate } from "lucide-react";
import { niches, templates } from "@/config/catalog";
import type { NicheId, Template } from "@/types/domain";
function TemplatePreview({ template }: { template: Template }) {
  const photographs: Record<string, string> = {
    "clinicas-A": "/templates/clinics/shared/clinic-reception-hero.png",
    "clinicas-B": "/templates/clinics/shared/clinic-room-structure.png",
    "advocacia-A": "/templates/law/shared/law-office-reception.png",
    "advocacia-B": "/templates/law/modern/hero-office.png",
    "imobiliarias-A":
      "/templates/real-estate/shared/real-estate-luxury-house-hero.png",
    "imobiliarias-B":
      "/templates/real-estate/shared/real-estate-apartment-interior.png",
    "restaurantes-A":
      "/templates/restaurants/shared/restaurant-dining-room.png",
    "restaurantes-B":
      "/templates/restaurants/shared/restaurant-bar-ambience.png",
  };
  return (
    <div
      className={`template-preview preview-${template.nicheId} variant-${template.variant}`}
      data-template={template.id}
      aria-label={`Representação conceitual de ${template.name}`}
    >
      <div className="mini-browser">
        <span />
        <span />
        <span />
        <small>CONCEITO VISUAL · {template.variant}</small>
      </div>
      <div className="mini-site">
        <div className="mini-nav">
          <b>
            {
              (
                {
                  clinicas: "essenza",
                  advocacia: "MOURA",
                  imobiliarias: "habita.",
                  restaurantes: "oliva",
                } as const
              )[template.nicheId]
            }
          </b>
          <span />
          <span />
          <i />
        </div>
        <div className="mini-hero">
          <div>
            <small>
              {
                (
                  {
                    clinicas: "CUIDADO EM CADA DETALHE",
                    advocacia: "CONFIANÇA QUE PERMANECE",
                    imobiliarias: "SEU PRÓXIMO ENDEREÇO",
                    restaurantes: "À MESA, BOAS HISTÓRIAS",
                  } as const
                )[template.nicheId]
              }
            </small>
            <strong>
              {
                (
                  {
                    clinicas: (
                      <>
                        Sua melhor
                        <br />
                        versão começa aqui.
                      </>
                    ),
                    advocacia: (
                      <>
                        Experiência que
                        <br />
                        faz a diferença.
                      </>
                    ),
                    imobiliarias: (
                      <>
                        Um lugar para
                        <br />
                        chamar de seu.
                      </>
                    ),
                    restaurantes: (
                      <>
                        O sabor de
                        <br />
                        estar presente.
                      </>
                    ),
                  } as const
                )[template.nicheId]
              }
            </strong>
            <p />
            <p />
            <span className="mini-cta">
              SAIBA MAIS <ArrowUpRight size={9} />
            </span>
          </div>
          <div className="mini-image">
            <Image
              src={photographs[template.id]}
              alt=""
              fill
              sizes="(max-width: 600px) 45vw, 25vw"
            />
          </div>
        </div>
        <div className="mini-services">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
export function TemplateLibrary() {
  const [niche, setNiche] = useState<NicheId | "">("");
  const visible = templates.filter((t) => !niche || t.nicheId === niche);
  return (
    <>
      <div className="library-toolbar">
        <div
          className="tabs"
          role="group"
          aria-label="Filtrar templates por nicho"
        >
          <button
            className={!niche ? "selected" : ""}
            onClick={() => setNiche("")}
          >
            Todos <span>8</span>
          </button>
          {niches.map((n) => (
            <button
              className={niche === n.id ? "selected" : ""}
              key={n.id}
              onClick={() => setNiche(n.id)}
            >
              {n.shortName}
              <span>2</span>
            </button>
          ))}
        </div>
        <span className="small muted">
          <LayoutTemplate size={15} /> {visible.length} templates
        </span>
      </div>
      <div className="templates-grid">
        {visible.map((template) => (
          <article className="template-card" key={template.id}>
            <TemplatePreview template={template} />
            <div className="template-content">
              <div className="template-meta">
                <span>
                  {niches.find((n) => n.id === template.nicheId)?.shortName}
                </span>
                <span className="variant-badge">
                  VARIANTE {template.variant}
                </span>
              </div>
              <h2>{template.name}</h2>
              <p>{template.description}</p>
              <div className="template-footer">
                <code>{template.id}</code>
                <span className="development">
                  <span />
                  {template.developmentStatus === "disponivel"
                    ? "Prévia privada disponível"
                    : "Planejado"}
                </span>
              </div>
              {template.developmentStatus === "disponivel" && (
                <Link href="/prototipos" className="button">
                  Abrir protótipos ↗
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="info-strip">
        <Blocks size={22} />
        <div>
          <strong>Uma base, muitas possibilidades.</strong>
          <p>
            As miniaturas são representações conceituais com fotografias
            ilustrativas. Para conferir qualquer um dos oito sites com os dados
            salvos, abra um protótipo e clique em Ver site.
          </p>
        </div>
        <Check size={20} />
      </div>
    </>
  );
}
