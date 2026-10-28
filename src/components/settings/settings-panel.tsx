"use client";
import { useState } from "react";
import {
  Blocks,
  Check,
  Globe2,
  LockKeyhole,
  Palette,
  Settings2,
} from "lucide-react";
export function SettingsPanel() {
  const [studio, setStudio] = useState("Loung Prototype Studio");
  const [workspace, setWorkspace] = useState("Workspace Loung");
  const [distribution, setDistribution] = useState(true);
  return (
    <div className="settings-layout">
      <div className="settings-main">
        <section className="panel settings-section">
          <div className="settings-title">
            <Settings2 size={20} />
            <div>
              <h2>Informações do Studio</h2>
              <p>
                Explore os campos. Alterações ficam somente nesta tela e são
                descartadas ao sair.
              </p>
            </div>
            <span className="planned-pill">Sem persistência</span>
          </div>
          <div className="form-grid">
            <label>
              Nome do Studio
              <input
                value={studio}
                onChange={(e) => setStudio(e.target.value)}
                maxLength={80}
              />
            </label>
            <label>
              Nome do workspace
              <input
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                maxLength={80}
              />
            </label>
          </div>
          <p className="field-hint">
            Prévia local: {studio || "Studio sem nome"} ·{" "}
            {workspace || "Workspace sem nome"}
          </p>
        </section>
        <section className="panel settings-section">
          <div className="settings-title">
            <Blocks size={20} />
            <div>
              <h2>Preferências de geração</h2>
              <p>Regras previstas para o futuro motor de protótipos.</p>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Um protótipo por lead</strong>
              <p>
                Regra fundamental: nenhuma versão simultânea para a mesma
                empresa.
              </p>
            </div>
            <span className="fixed-rule">
              <Check size={15} />
              Regra fixa
            </span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Distribuição equilibrada entre A e B</strong>
              <p>
                Preferência ilustrativa. Não altera o catálogo ou os exemplos.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={distribution}
              aria-label="Prévia da distribuição equilibrada"
              className={`switch ${distribution ? "on" : ""}`}
              onClick={() => setDistribution(!distribution)}
            >
              <span />
            </button>
          </div>
          <p className="field-hint">
            A troca manual de template será disponibilizada em uma fase futura.
          </p>
        </section>
        <section className="panel settings-section">
          <div className="settings-title">
            <Globe2 size={20} />
            <div>
              <h2>Publicação</h2>
              <p>Uma única aplicação, um endereço exclusivo por protótipo.</p>
            </div>
            <span className="planned-pill">Fase futura</span>
          </div>
          <div className="setting-row">
            <div>
              <strong>Revisão antes da publicação</strong>
              <p>Links públicos e aprovação ainda não estão disponíveis.</p>
            </div>
            <LockKeyhole size={18} />
          </div>
          <label className="disabled-field">
            Domínio dos protótipos
            <input disabled placeholder="Definido na fase de publicação" />
          </label>
        </section>
        <section className="panel settings-section">
          <div className="settings-title">
            <Palette size={20} />
            <div>
              <h2>Identidade administrativa</h2>
              <p>Tokens centralizados, preparados para evoluir com a marca.</p>
            </div>
          </div>
          <div className="color-tokens">
            {[
              { name: "Preto", color: "#101010" },
              { name: "Branco", color: "#FFFFFF" },
              { name: "Verde-lima", color: "#A4FF39" },
              { name: "Fundo", color: "#F7F7F5" },
            ].map((token) => (
              <div key={token.name}>
                <span style={{ background: token.color }} />
                <strong>{token.name}</strong>
                <code>{token.color}</code>
              </div>
            ))}
          </div>
          <p className="field-hint">
            Os templates dos clientes terão identidade própria, independente
            deste painel.
          </p>
        </section>
      </div>
      <aside className="panel integrations-panel">
        <span className="integration-icon">
          <Blocks size={24} />
        </span>
        <p className="eyebrow">CONECTAR PARA EVOLUIR</p>
        <h2>Integrações</h2>
        <p>
          Autenticação integrada. As demais funcionalidades evoluirão nas
          próximas fases.
        </p>
        {[
          { name: "Supabase", description: "Banco de dados e autenticação" },
          {
            name: "Loung Prospect",
            description: "Mapeamento de planilhas exportadas",
          },
          { name: "Vercel", description: "Hospedagem da aplicação Next.js" },
        ].map((item) => (
          <div className="integration-row" key={item.name}>
            <span className="integration-monogram">{item.name[0]}</span>
            <div>
              <strong>{item.name}</strong>
              <small>{item.description}</small>
              <span className="muted small">
                {item.name === "Supabase"
                  ? "Acesso validado no servidor"
                  : "Não conectado"}
              </span>
            </div>
          </div>
        ))}
        <div className="future-note">
          <LockKeyhole size={17} />
          <p>
            Supabase Auth protege o acesso. Dados das telas e preferências
            continuam demonstrativos.
          </p>
        </div>
      </aside>
    </div>
  );
}
