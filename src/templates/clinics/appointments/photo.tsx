"use client";
import Image from "next/image";
import { useState } from "react";
import type { AppointmentPhoto } from "../../../lib/generation/appointments-design";
import { clinicPhotoSource } from "../shared/photo-recovery";
export function AppointmentPhotoFrame({
  photo,
  role,
  priority = false,
  fallback = null,
}: {
  photo: AppointmentPhoto;
  role: "hero" | "about" | "gallery";
  priority?: boolean;
  fallback?: AppointmentPhoto | null;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = clinicPhotoSource(photo.src, fallback?.src ?? null, failed);
  if (!src)
    return (
      <div className={`bPhotoFallback bPhoto-${role}`} role="note">
        <span>Imagem de apresentação</span>
        <p>
          Uma fotografia compatível com esta especialidade poderá ser
          selecionada no painel.
        </p>
      </div>
    );
  const displayed = src === photo.src ? photo : fallback!;
  const portrait = /doctor-consultation-main|consultation-detail/.test(src);
  const illustrative = displayed.illustrative !== false;
  const position = displayed.position ?? "center";
  const objectPosition =
    role === "hero" && ["center", "left", "right"].includes(position)
      ? `${position} 25%`
      : position;
  const caption =
    displayed.caption ||
    (illustrative
      ? "Referência visual de atendimento e ambiente"
      : "Imagem fornecida pela clínica");
  return (
    <figure className={`bPhoto bPhoto-${role}`}>
      <Image
        src={src}
        alt={`${caption}${illustrative ? "; imagem ilustrativa, não representa instalações ou profissionais da clínica" : ""}`}
        width={portrait ? 1122 : 1448}
        height={portrait ? 1402 : 1086}
        priority={priority}
        sizes={
          role === "gallery"
            ? "(max-width: 600px) 88vw, (max-width: 900px) 46vw, 33vw"
            : "(max-width: 767px) 100vw, 58vw"
        }
        style={{ objectPosition }}
        onError={() => {
          console.warn("[clinic-image] Falha de carregamento", {
            template: "B",
            role,
          });
          setFailed((previous) => [...previous, src]);
        }}
      />
      <figcaption>
        {caption}
        {illustrative && <span> · Imagem ilustrativa</span>}
      </figcaption>
    </figure>
  );
}
