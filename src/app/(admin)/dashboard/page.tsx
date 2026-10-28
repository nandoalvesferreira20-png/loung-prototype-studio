import { requireAdminPage } from "@/lib/auth/server";
import Link from "next/link";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Blocks,
  Check,
  Circle,
  FileClock,
  Globe2,
  Layers3,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeading, DemoNote } from "@/components/ui";
import { PrototypeTable } from "@/components/prototypes/prototype-table";
import { demoLeads, demoPrototypes } from "@/data/demo";
import { niches } from "@/config/catalog";
export default async function Dashboard() {
  await requireAdminPage();
  const published = demoPrototypes.filter(
    (p) => p.status === "publicado",
  ).length;
  const drafts = demoPrototypes.filter((p) => p.status === "rascunho").length;
  const review = demoPrototypes.length - published - drafts;
  const metrics = [
    {
      label: "Leads importados",
      value: demoLeads.length,
      icon: Users,
      detail: "Empresas no workspace",
    },
    {
      label: "Protótipos gerados",
      value: demoPrototypes.length,
      icon: Layers3,
      detail: "Uma ideia para cada empresa",
    },
    {
      label: "Protótipos publicados",
      value: published,
      icon: Globe2,
      detail: "Publicações ilustrativas",
    },
    {
      label: "Em rascunho",
      value: drafts,
      icon: FileClock,
      detail: "Aguardando o próximo passo",
    },
  ];
  return (
    <>
      <PageHeading
        eyebrow="SEU CENTRO DE CRIAÇÃO"
        title="Boas ideias começam aqui."
        description="Acompanhe seus protótipos e transforme o próximo contato em oportunidade."
        action={
          <Link className="button primary" href="/importacoes">
            <Plus size={17} />
            Nova importação
          </Link>
        }
      />
      <DemoNote />
      <section className="metrics-grid" aria-label="Indicadores demonstrativos">
        {metrics.map(({ label, value, icon: Icon, detail }) => (
          <article className="metric" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <p>
              <span className="tiny-dot" />
              {detail}
            </p>
          </article>
        ))}
      </section>
      <section className="studio-banner">
        <div>
          <span className="banner-kicker">
            <Sparkles size={14} />
            DO LEAD À PRIMEIRA IMPRESSÃO
          </span>
          <h2>
            Seu próximo projeto
            <br />
            começa com uma possibilidade.
          </h2>
          <p>
            Quatro nichos. Oito pontos de partida. Um Studio para criar
            conexões.
          </p>
          <Link className="button lime" href="/templates">
            Conhecer os templates
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="art-browser art-back">
            <div className="browser-dots">
              <i />
              <i />
              <i />
            </div>
            <div className="art-lines">
              <b />
              <b />
              <b />
            </div>
          </div>
          <div className="art-browser art-front">
            <div className="art-top">
              <span>loung studio</span>
              <ArrowUpRight size={15} />
            </div>
            <div className="art-spark">✳</div>
            <strong>
              Feito para
              <br />o próximo.
            </strong>
            <div className="art-bottom">
              <span>IDEIAS EM MOVIMENTO</span>
              <span>↗</span>
            </div>
          </div>
          <span className="art-label">
            <span />
            Uma nova perspectiva
          </span>
        </div>
      </section>
      <section className="panel recent-panel">
        <div className="section-heading">
          <div>
            <h2>
              Protótipos recentes{" "}
              <span className="count">{demoPrototypes.length}</span>
            </h2>
            <p>Os últimos projetos do seu workspace demonstrativo.</p>
          </div>
          <Link className="text-link" href="/prototipos">
            Ver todos
            <ArrowRight size={16} />
          </Link>
        </div>
        <PrototypeTable items={demoPrototypes.slice(0, 4)} compact />
      </section>
      <div className="dashboard-bottom">
        <section className="panel niche-panel">
          <div className="section-heading">
            <div>
              <h2>Distribuição por nicho</h2>
              <p>O universo dos seus protótipos.</p>
            </div>
            <span className="muted small">
              {demoPrototypes.length} no total
            </span>
          </div>
          <div className="distribution">
            {niches.map((n, i) => {
              const count = demoPrototypes.filter(
                (p) => demoLeads.find((l) => l.id === p.leadId)?.nicho === n.id,
              ).length;
              return (
                <div className="distribution-row" key={n.id}>
                  <span className={`legend-dot legend-${i}`} />
                  <span>{n.shortName}</span>
                  <div className="progress-track">
                    <div
                      className={`progress-fill legend-${i}`}
                      style={{
                        width: `${(count / demoPrototypes.length) * 100}%`,
                      }}
                    />
                  </div>
                  <b>{count}</b>
                  <small>{(count / demoPrototypes.length) * 100}%</small>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel publication-panel">
          <div className="section-heading">
            <div>
              <h2>Status de publicação</h2>
              <p>Cada projeto no seu momento.</p>
            </div>
          </div>
          <div className="publication-body">
            <div
              className="donut"
              style={{
                background: `conic-gradient(var(--lime) 0 ${(published / 8) * 100}%,#252525 ${(published / 8) * 100}% ${((published + review) / 8) * 100}%,#e9e9e5 ${((published + review) / 8) * 100}% 100%)`,
              }}
            >
              <div>
                <strong>08</strong>
                <small>protótipos</small>
              </div>
            </div>
            <div className="status-legend">
              <span>
                <i className="legend-0" />
                Publicados<b>{published}</b>
              </span>
              <span>
                <i className="legend-1" />
                Em revisão<b>{review}</b>
              </span>
              <span>
                <i className="legend-3" />
                Rascunhos<b>{drafts}</b>
              </span>
            </div>
          </div>
        </section>
      </div>
      <section className="quick-actions">
        <span className="eyebrow">PRÓXIMOS PASSOS</span>
        <Link href="/importacoes">
          <ArrowDownToLine size={20} />
          <div>
            <strong>Traga suas oportunidades</strong>
            <small>Conheça o fluxo de importação</small>
          </div>
          <ArrowUpRight size={18} />
        </Link>
        <Link href="/templates">
          <Blocks size={20} />
          <div>
            <strong>Encontre o ponto de partida</strong>
            <small>Explore a biblioteca de templates</small>
          </div>
          <ArrowUpRight size={18} />
        </Link>
        <span className="workflow-note">
          <Check size={16} />
          Um lead, um protótipo.
          <Circle size={5} />
        </span>
      </section>
    </>
  );
}
