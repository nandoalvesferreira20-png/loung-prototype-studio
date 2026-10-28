"use client";
import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpFromLine,
  Check,
  FileSpreadsheet,
  FileUp,
  Info,
  X,
} from "lucide-react";
import { importFields } from "@/config/catalog";
import { demoImports } from "@/data/demo";
import { formatDate } from "@/lib/prototypes";
export function ImportWorkspace() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  function select(file?: File) {
    setError("");
    setFile(null);
    if (!file) return;
    if (!/\.(csv|xlsx)$/i.test(file.name)) {
      setError("Selecione um arquivo CSV ou XLSX.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("O limite para seleção é de 10 MB.");
      return;
    }
    setFile(file);
  }
  return (
    <>
      <div className="import-layout">
        <section className="panel upload-panel">
          <div className="section-heading">
            <div>
              <h2>Comece pela sua planilha</h2>
              <p>Organize suas oportunidades em um só lugar.</p>
            </div>
            <span className="step-number">01</span>
          </div>
          <div
            className={`dropzone ${drag ? "dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              select(e.dataTransfer.files[0]);
            }}
          >
            <span className="upload-icon">
              <ArrowUpFromLine size={27} />
            </span>
            <h3>
              {file
                ? "Arquivo selecionado localmente"
                : "Arraste sua planilha até aqui"}
            </h3>
            <p>
              {file ? file.name : "ou escolha um arquivo no seu computador"}
            </p>
            <button
              className="button primary"
              onClick={() => input.current?.click()}
            >
              <FileUp size={16} />
              {file ? "Trocar arquivo" : "Selecionar arquivo"}
            </button>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".csv,.xlsx"
              aria-label="Selecionar planilha CSV ou XLSX"
              onChange={(e) => select(e.target.files?.[0])}
            />
            <small>CSV ou XLSX · até 10 MB · seleção local</small>
          </div>
          {error && (
            <p className="error-message" role="alert">
              <AlertCircle size={16} />
              {error}
            </p>
          )}
          {file && (
            <div className="selected-file">
              <FileSpreadsheet size={20} />
              <div>
                <strong>{file.name}</strong>
                <small>
                  {(file.size / 1024).toFixed(1)} KB · não enviado nem
                  processado
                </small>
              </div>
              <button
                aria-label="Remover arquivo"
                className="icon-button"
                onClick={() => {
                  setFile(null);
                  if (input.current) input.current.value = "";
                }}
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="future-note">
            <Info size={18} />
            <p>
              <strong>O processamento chega em uma próxima fase.</strong> Você
              pode selecionar um arquivo para conhecer a interface. Seu conteúdo
              não é lido, enviado ou importado.
            </p>
          </div>
          <button disabled className="button disabled-button">
            Processar planilha · em breve
          </button>
        </section>
        <aside className="panel import-guide">
          <p className="eyebrow">ANTES DE COMEÇAR</p>
          <h2>
            Uma boa base faz
            <br />
            toda a diferença.
          </h2>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Exporte seus leads</strong>
                <p>Utilize uma planilha CSV ou XLSX do Loung Prospect.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Confira as informações</strong>
                <p>
                  O nome da empresa será obrigatório. Quanto mais contexto,
                  melhor.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Mapeie e revise</strong>
                <p>
                  O mapeamento de colunas e a validação serão implementados na
                  próxima fase.
                </p>
              </div>
            </li>
          </ol>
          <div className="guide-rule">
            <Check size={18} />
            <span>
              Um lead. Um protótipo.
              <br />
              <small>Sem versões simultâneas.</small>
            </span>
          </div>
        </aside>
      </div>
      <section className="panel preview-panel">
        <div className="section-heading">
          <div>
            <h2>Pré-visualização dos registros</h2>
            <p>Área reservada para o futuro mapeamento e validação de dados.</p>
          </div>
          <span className="planned-pill">Em breve</span>
        </div>
        <div className="preview-counts">
          <span>
            <i className="valid-dot" />
            Válidos <strong>—</strong>
          </span>
          <span>
            <i className="invalid-dot" />
            Inválidos <strong>—</strong>
          </span>
          <span>
            Total <strong>—</strong>
          </span>
        </div>
        <div className="empty-state">
          <FileSpreadsheet size={30} />
          <h3>Seus registros aparecerão aqui</h3>
          <p>
            A seleção de arquivo ainda não gera uma prévia ou contagem de
            registros.
          </p>
        </div>
      </section>
      <details className="panel expected-fields">
        <summary>
          Campos esperados na planilha <span>13 campos · 1 obrigatório</span>
        </summary>
        <div className="fields-grid">
          {importFields.map((field) => (
            <div key={field.key}>
              <code>{field.key}</code>
              <span>
                {field.label}
                {field.required && <b>Obrigatório</b>}
              </span>
            </div>
          ))}
        </div>
        <p>
          Os cabeçalhos reais poderão ser associados a estes campos com um
          mapeamento explícito. Nicho e especialidade serão atributos separados;
          leads sem nicho dependerão de classificação futura.
        </p>
      </details>
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Histórico demonstrativo</h2>
            <p>Exemplos fictícios de como as importações serão apresentadas.</p>
          </div>
          <span className="count">2</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Data</th>
                <th>Registros</th>
                <th>Válidos / inválidos</th>
                <th>Status ilustrativo</th>
              </tr>
            </thead>
            <tbody>
              {demoImports.map((batch) => (
                <tr key={batch.id}>
                  <td>
                    <div className="file-cell">
                      <FileSpreadsheet size={19} />
                      <strong>{batch.filename}</strong>
                    </div>
                  </td>
                  <td>{formatDate(batch.createdAt)}</td>
                  <td>{batch.total}</td>
                  <td>
                    {batch.valid} / {batch.invalid}
                  </td>
                  <td>
                    <span
                      className={`badge ${batch.status === "concluida" ? "status-publicado" : "status-revisao"}`}
                    >
                      <i />
                      {batch.status === "concluida" ? "Concluída" : "Parcial"} ·
                      exemplo
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
