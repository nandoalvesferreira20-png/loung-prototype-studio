"use client";
import Image from "next/image";
import { useState } from "react";
import type { EstatePhoto } from "../../../lib/generation/real-estate-design";
export function EstatePhotoFrame({
  photo,
  hero = false,
  illustrative = true,
}: {
  photo: EstatePhoto;
  hero?: boolean;
  illustrative?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <figure className="rePhoto">
      {photo.src && failed !== photo.src ? (
        <Image
          src={photo.src}
          alt={
            (photo.alt || "Fotografia") +
            (illustrative
              ? " — imagem ilustrativa, não é anúncio de imóvel disponível."
              : "")
          }
          fill
          sizes={hero ? "100vw" : "(max-width: 700px) 100vw, 50vw"}
          priority={hero}
          style={{
            objectFit: "cover",
            objectPosition: photo.position || "center",
          }}
          onError={() => setFailed(photo.src)}
        />
      ) : (
        <div className="rePhotoFallback">Imagem não disponível</div>
      )}
      {illustrative && <figcaption>Imagem ilustrativa</figcaption>}
    </figure>
  );
}
