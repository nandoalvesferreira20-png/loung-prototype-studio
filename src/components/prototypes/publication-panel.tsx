"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  reviewPublication,
  publishPrototype,
  unpublishPrototype,
} from "@/app/(admin)/prototipos/publication-actions";
import { sharingMessage } from "@/lib/publication";
type Review = Extract<
  Awaited<ReturnType<typeof reviewPublication>>,
  { ok: true }
>["data"];
export function PublicationPanel({
  id,
  activeVersion,
}: {
  id: string;
  activeVersion?: number;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [approved, setApproved] = useState(false);
  useEffect(() => {
    if (review && dialog.current && !dialog.current.open)
      dialog.current.showModal();
  }, [review]);
  async function load() {
    setBusy(true);
    setApproved(false);
    const result = await reviewPublication(id);
    if (result.ok) setReview(result.data);
    else setMessage(result.error);
    setBusy(false);
  }
  async function mutate(remove: boolean) {
    if (!review) return;
    setBusy(true);
    const result = remove
      ? await unpublishPrototype(id, review.publication!.publication_version)
      : await publishPrototype({
          id,
          revision: review.revision,
          version: review.publication?.publication_version ?? 0,
          snapshot: review.snapshot,
          approved,
        });
    if (result.ok) {
      setMessage(remove ? "Site despublicado." : "Snapshot publicado.");
      await load();
      router.refresh();
    } else setMessage(result.error);
    setBusy(false);
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMessage("Copiado.");
    } catch {
      setMessage("Cópia indisponível. Selecione o link exibido.");
    }
  }
  const active = review?.publication && !review.publication.unpublished_at;
  return (
    <div className="publication-controls">
      <button className="button" disabled={busy} onClick={load}>
        Revisar publicação
      </button>
      {activeVersion && (
        <button
          className="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await unpublishPrototype(id, activeVersion);
            setMessage(result.ok ? "Site despublicado." : result.error);
            setBusy(false);
            if (result.ok) router.refresh();
          }}
        >
          Despublicar
        </button>
      )}
      {message && <p role="status">{message}</p>}
      {review && (
        <dialog
          ref={dialog}
          onCancel={() => {
            setReview(null);
            setApproved(false);
          }}
          className="publication-dialog"
          aria-labelledby={`publication-${id}`}
        >
          <h2 id={`publication-${id}`}>Publicar protótipo</h2>
          {message && <p role="status">{message}</p>}
          <p>
            <strong>{review.snapshot.confirmed.name}</strong> ·{" "}
            {review.template}
          </p>
          <p>
            Status:{" "}
            {active
              ? "Publicado"
              : review.publication
                ? "Despublicado"
                : "Nunca publicado"}{" "}
            · /p/{review.slug}
          </p>
          {review.publication && (
            <p>
              Versão {review.publication.publication_version} ·{" "}
              {new Date(review.publication.published_at).toLocaleString(
                "pt-BR",
              )}{" "}
              ·{" "}
              {review.revision !== review.publication.source_revision
                ? "Alterações não publicadas"
                : "Rascunho corresponde à revisão publicada"}
            </p>
          )}
          {review.warnings.map((w) => (
            <p key={w} className="form-hint">
              {w}
            </p>
          ))}
          <a
            className="text-link"
            href={`/prototipos/${id}/preview`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Revisar site na prévia autenticada
          </a>
          <details>
            <summary>Dados exatos que ficarão públicos</summary>
            <pre>{JSON.stringify(review.snapshot, null, 2)}</pre>
          </details>
          <label>
            <input
              type="checkbox"
              checked={approved}
              onChange={(e) => setApproved(e.target.checked)}
            />{" "}
            Revisei a prévia e os dados. Autorizo sua publicação, inclusive
            imagens e canais de contato.
          </label>
          <div className="button-row">
            <button
              className="button"
              disabled={busy}
              onClick={() => {
                setReview(null);
                setApproved(false);
              }}
            >
              Cancelar
            </button>
            <button
              className="button button-primary"
              disabled={busy || !approved}
              onClick={() => mutate(false)}
            >
              {active ? "Confirmar republicação" : "Confirmar publicação"}
            </button>
            {active && (
              <button
                className="button"
                disabled={busy}
                onClick={() => mutate(true)}
              >
                Despublicar
              </button>
            )}
          </div>
          {active && review.url && (
            <div className="button-row">
              <a
                href={review.url}
                target="_blank"
                rel="noopener noreferrer"
                className="button"
              >
                Abrir site público
              </a>
              <button className="button" onClick={() => copy(review.url!)}>
                Copiar link
              </button>
              <button
                className="button"
                onClick={() => copy(sharingMessage(review.url!))}
              >
                Copiar mensagem para WhatsApp
              </button>
              <p>{review.url}</p>
            </div>
          )}
        </dialog>
      )}
    </div>
  );
}
