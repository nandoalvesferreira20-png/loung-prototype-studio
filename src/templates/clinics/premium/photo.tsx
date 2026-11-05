"use client";
import Image from "next/image";
import { useState } from "react";
import type { PremiumPhoto } from "./photography";
import { clinicPhotoSource } from "../shared/photo-recovery";

export function PremiumPhotoFrame({
  photo,
  role,
  priority = false,
  fallback = null,
}: {
  photo: PremiumPhoto | null;
  role: "hero" | "institutional" | "detail" | "room";
  priority?: boolean;
  fallback?: PremiumPhoto | null;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const src = clinicPhotoSource(
    photo?.src ?? null,
    fallback?.src ?? null,
    failed,
  );
  const displayed = src === photo?.src ? photo : fallback;
  if (!src || !displayed)
    return (
      <div className="premiumPhotoMissing" role="note">
        Fotografia do ambiente em preparação.
      </div>
    );
  return (
    <figure className={`premiumPhoto premiumPhoto-${role}`}>
      <Image
        src={src}
        alt={displayed.alt}
        width={displayed.width}
        height={displayed.height}
        priority={priority}
        sizes={
          role === "hero"
            ? "100vw"
            : role === "detail"
              ? "(max-width: 767px) 88vw, 40vw"
              : "(max-width: 767px) 100vw, 50vw"
        }
        style={{ objectPosition: displayed.position }}
        onError={() => {
          console.warn("[clinic-image] Falha de carregamento", {
            template: "A",
            role,
          });
          setFailed((previous) => [...previous, src]);
        }}
      />
      <figcaption>Fotografia de referência · ambiente ilustrativo</figcaption>
    </figure>
  );
}
