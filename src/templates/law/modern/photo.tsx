"use client";
import Image from "next/image";
import { useState } from "react";
import type { ModernPhoto } from "../../../lib/generation/law-modern-design";
export function ModernPhotoFrame({
  photo,
  role,
  priority = false,
}: {
  photo: ModernPhoto;
  role: "hero" | "about" | "contact" | "team" | "demo";
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!photo.src || failed === photo.src)
    return (
      <div className={`lmPhotoFallback lmPhoto-${role}`} role="note">
        Fotografia de apresentação a definir.
      </div>
    );
  const illustrative =
    photo.illustrative !== false ||
    photo.src.toLowerCase().startsWith("/templates/law/modern/");
  return (
    <figure className={`lmPhoto lmPhoto-${role}`}>
      <Image
        src={photo.src}
        width={1536}
        height={1024}
        alt={`${photo.alt || photo.caption || "Imagem de apresentação"}${illustrative ? "; imagem ilustrativa, não representa o escritório ou seus profissionais" : ""}`}
        priority={priority}
        sizes={
          role === "hero"
            ? "(max-width: 767px) 100vw, 65vw"
            : role === "team"
              ? "(max-width: 767px) 45vw, 25vw"
              : "(max-width: 767px) 100vw, 50vw"
        }
        style={{ objectPosition: photo.position ?? "center" }}
        onError={() => setFailed(photo.src)}
      />
      {role !== "team" && (
        <figcaption>
          {photo.caption || "Imagem de apresentação"}
          {illustrative && !photo.caption?.includes("ilustrativa") && (
            <span> · Imagem ilustrativa</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
