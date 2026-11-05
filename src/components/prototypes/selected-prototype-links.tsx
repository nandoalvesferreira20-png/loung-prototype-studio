"use client";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Copy, Link2 } from "lucide-react";
import {
  OPEN_LINK_PAGE_SIZE,
  type openingSelection,
} from "@/lib/prototype-links";

export function SelectedPrototypeLinks({
  data,
  busy,
  message,
  onClose,
  onShare,
}: {
  data: ReturnType<typeof openingSelection>;
  busy: boolean;
  message: string;
  onClose: () => void;
  onShare: (csv: boolean) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);
  const visible = data.links.slice(
    page * OPEN_LINK_PAGE_SIZE,
    (page + 1) * OPEN_LINK_PAGE_SIZE,
  );
  return (
    <dialog
      ref={dialog}
      className="publication-dialog"
      aria-labelledby="selected-links-title"
      onCancel={onClose}
    >
      <h2 id="selected-links-title">
        <Link2 size={22} aria-hidden="true" /> Abrir selecionados
      </h2>
      <p>
        {data.links.length} link(s) público(s) ativo(s) confirmado(s) entre{" "}
        {data.total} selecionado(s). Clique em cada empresa para abrir em nova
        aba.
      </p>
      <p className="form-hint">
        Até cinco links por página, sem abertura automática de abas. Você também
        pode copiar todos os links ou exportar CSV.
      </p>
      {data.links.length ? (
        <ul className="selected-prototype-links">
          {visible.map((item) => (
            <li key={item.id}>
              <a
                className="text-link"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={16} aria-hidden="true" />
                {item.company}
                <span className="sr-only"> — abrir site em nova aba</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>Nenhum selecionado possui link público ativo.</p>
      )}
      {!!data.omitted.length && (
        <details open>
          <summary>
            {data.omitted.length} item(ns) sem link público disponível
          </summary>
          <ul>
            {data.omitted.map((name, index) => (
              <li key={index}>{name}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="publication-toolbar">
        <button
          className="button"
          disabled={page === 0}
          onClick={() => setPage(page - 1)}
        >
          Anterior
        </button>
        <span>
          Página {page + 1} de{" "}
          {Math.max(1, Math.ceil(data.links.length / OPEN_LINK_PAGE_SIZE))}
        </span>
        <button
          className="button"
          disabled={(page + 1) * OPEN_LINK_PAGE_SIZE >= data.links.length}
          onClick={() => setPage(page + 1)}
        >
          Próxima
        </button>
      </div>
      <div className="publication-toolbar">
        <button
          className="button"
          disabled={busy || !data.links.length}
          onClick={() => onShare(false)}
        >
          <Copy size={16} aria-hidden="true" />
          Copiar todos os links
        </button>
        <button
          className="button"
          disabled={busy || !data.links.length}
          onClick={() => onShare(true)}
        >
          Exportar links CSV
        </button>
        <button className="button" onClick={onClose}>
          Fechar
        </button>
      </div>
      <p role="status">{message}</p>
    </dialog>
  );
}
