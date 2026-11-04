"use client";
import Image from "next/image";
import { useState } from "react";
import type { PremiumPhoto } from "./photography";

export function PremiumPhotoFrame({
  photo,
  role,
  priority = false,
}: {
  photo: PremiumPhoto | null;
  role: "hero" | "institutional" | "detail" | "room";
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed)
    return (
      <div className="premiumPhotoMissing" role="note">
        Fotografia do ambiente em preparação.
      </div>
    );
  return (
    <figure className={`premiumPhoto premiumPhoto-${role}`}>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        priority={priority}
        sizes={
          role === "hero"
            ? "100vw"
            : role === "detail"
              ? "(max-width: 767px) 88vw, 40vw"
              : "(max-width: 767px) 100vw, 50vw"
        }
        style={{ objectPosition: photo.position }}
        onError={() => setFailed(true)}
      />
      <figcaption>Fotografia de referência · ambiente ilustrativo</figcaption>
    </figure>
  );
}
