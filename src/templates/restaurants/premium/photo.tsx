"use client";
import Image from "next/image";
import { useState } from "react";
import type { RestaurantPhoto } from "../../../lib/generation/restaurant-design";
export function RestaurantPhotoFrame({
  photo,
  hero = false,
  wide = false,
}: {
  photo: RestaurantPhoto;
  hero?: boolean;
  wide?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  return (
    <figure className="rpPhoto">
      {photo.src && photo.src !== failed ? (
        <Image
          src={photo.src}
          alt={
            (photo.alt || "Fotografia") +
            (photo.demonstration
              ? " — referência ilustrativa, não representa necessariamente o estabelecimento ou seu cardápio."
              : "")
          }
          fill
          sizes={
            hero || wide
              ? "100vw"
              : "(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 45vw"
          }
          priority={hero}
          style={{
            objectFit: "cover",
            objectPosition: photo.position || "center",
          }}
          onError={() => setFailed(photo.src)}
        />
      ) : (
        <div className="rpPhotoFallback">
          {photo.src ? "Imagem não disponível" : "Sem fotografia"}
        </div>
      )}
      {(photo.demonstration || photo.caption) && (
        <figcaption>
          {photo.demonstration ? "Referência ilustrativa" : ""}
          {photo.demonstration && photo.caption ? " · " : ""}
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}
