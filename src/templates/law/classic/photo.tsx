"use client";
import Image from "next/image";
import { useState } from "react";
import type { LawPhoto } from "../../../lib/generation/law-design";
import { isBrandedReception } from "./photography";
export function LawPhotoFrame({
  photo,
  role,
  priority = false,
}: {
  photo: LawPhoto;
  role: "hero" | "about" | "editorial" | "contact" | "team";
  priority?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = photo.src;
  if (!src || failed === src)
    return (
      <div className={`lawPhotoMissing lawPhoto-${role}`} role="note">
        Fotografia de apresentação a definir.
      </div>
    );
  const cropped = isBrandedReception(src);
  const illustrative =
    photo.illustrative !== false ||
    src.toLowerCase().startsWith("/templates/law/shared/");
  const caption =
    photo.caption ||
    (illustrative
      ? "Referência visual de ambiente"
      : "Fotografia fornecida e autorizada");
  return (
    <figure
      className={`lawPhoto lawPhoto-${role}${cropped ? " lawSafeCrop" : ""}`}
      data-safe-crop={cropped || undefined}
    >
      <Image
        src={src}
        width={763}
        height={507}
        alt={`${caption}${illustrative ? "; imagem ilustrativa, não representa o escritório ou seus profissionais" : ""}`}
        priority={priority}
        sizes={
          cropped
            ? "250vw"
            : role === "hero" || role === "editorial"
              ? "100vw"
              : "(max-width: 767px) 100vw, 50vw"
        }
        style={
          cropped
            ? {
                objectPosition: "right",
                width: "250%",
                maxWidth: "none",
                height: "100%",
                position: "absolute",
                right: 0,
                top: 0,
                objectFit: "cover",
              }
            : { objectPosition: photo.position ?? "center" }
        }
        onError={() => setFailed(src)}
      />
      {role !== "team" && (
        <figcaption>
          {caption}
          {illustrative && <span> · Imagem ilustrativa</span>}
        </figcaption>
      )}
    </figure>
  );
}
