"use client";
import { useState } from "react";
import { ArrowUpRight, Blocks, Check, LayoutTemplate } from "lucide-react";
import { niches, templates } from "@/config/catalog";
import type { NicheId, Template } from "@/types/domain";
function TemplatePreview({ template }: { template: Template }) {
  return (
    <div
      className={`template-preview preview-${template.nicheId} variant-${template.variant}`}
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
            <span />
            <span />
            <span />
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
                  Planejado
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="info-strip">
        <Blocks size={22} />
        <div>
          <strong>Uma base, muitas possibilidades.</strong>
          <p>
            Prévias conceituais, sem páginas funcionais nesta fase. Cada nicho
            terá dois templates com distribuição equilibrada e troca manual
            futura.
          </p>
        </div>
        <Check size={20} />
      </div>
    </>
  );
}
