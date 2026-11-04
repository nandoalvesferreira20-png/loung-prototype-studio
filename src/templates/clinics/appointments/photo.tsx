"use client";
import Image from "next/image";
import { useState } from "react";
import type { AppointmentPhoto } from "../../../lib/generation/appointments-design";
export function AppointmentPhotoFrame({
  photo,
  role,
  priority = false,
}: {
  photo: AppointmentPhoto;
  role: "hero" | "about" | "gallery";
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!photo.src || failedSrc === photo.src)
    return (
      <div className={`bPhotoFallback bPhoto-${role}`} role="note">
        <span>Imagem de apresentação</span>
        <p>
          Uma fotografia compatível com esta especialidade poderá ser
          selecionada no painel.
        </p>
      </div>
    );
  const portrait = /doctor-consultation-main|consultation-detail/.test(
    photo.src,
  );
  const illustrative = photo.illustrative !== false;
  const position = photo.position ?? "center";
  const objectPosition =
    role === "hero" && ["center", "left", "right"].includes(position)
      ? `${position} 25%`
      : position;
  const caption =
    photo.caption ||
    (illustrative
      ? "Referência visual de atendimento e ambiente"
      : "Imagem fornecida pela clínica");
  return (
    <figure className={`bPhoto bPhoto-${role}`}>
      <Image
        src={photo.src}
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
        onError={() => setFailedSrc(photo.src)}
      />
      <figcaption>
        {caption}
        {illustrative && <span> · Imagem ilustrativa</span>}
      </figcaption>
    </figure>
  );
}
