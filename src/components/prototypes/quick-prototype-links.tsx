"use client";
import { useState } from "react";
import { Copy, ExternalLink, Eye } from "lucide-react";
import {
  activePrototypeUrl,
  previewUrl,
  copyPrototypeLink,
} from "@/lib/prototype-links";

export function QuickPrototypeLinks({
  id,
  name,
  slug,
  active,
  base,
  previewAvailable = true,
}: {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  base: string | null;
  previewAvailable?: boolean;
}) {
  const url = activePrototypeUrl(base, slug, active);
  const preview = previewAvailable ? previewUrl(id) : null;
  const [message, setMessage] = useState("");
  async function copy() {
    if (!url) return;
    try {
      await copyPrototypeLink(base, slug, active, (value) =>
        navigator.clipboard.writeText(value),
      );
      setMessage("Link copiado.");
    } catch {
      setMessage("Não foi possível copiar. Use o endereço de Abrir site.");
    }
  }
  return (
    <div className="prototype-quick-links">
      {url ? (
        <a
          className="text-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir site de ${name} em nova aba`}
        >
          <ExternalLink size={16} aria-hidden="true" />
          Abrir site
        </a>
      ) : preview ? (
        <a
          className="text-link"
          href={preview}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visualizar prévia de ${name} em nova aba`}
        >
          <Eye size={16} aria-hidden="true" />
          Visualizar prévia
        </a>
      ) : (
        <small>Prévia indisponível</small>
      )}
      <button
        type="button"
        className="icon-button"
        disabled={!url}
        onClick={() => void copy()}
        aria-label={`Copiar link público de ${name}`}
        title={url ? "Copiar link público" : "Link público indisponível"}
      >
        <Copy size={16} aria-hidden="true" />
      </button>
      {active && !url && <small>Link público indisponível</small>}
      <span className="prototype-link-feedback" role="status">
        {message}
      </span>
    </div>
  );
}
