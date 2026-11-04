import Image from "next/image";
import type { ClinicModel } from "./adapter";
export function Artwork({
  model,
  priority = false,
}: {
  model: ClinicModel;
  priority?: boolean;
}) {
  return (
    <figure>
      <Image
        src={model.image}
        alt={`Composição abstrata demonstrativa — ${model.art.category}`}
        width={960}
        height={1100}
        priority={priority}
        sizes="(max-width: 767px) 100vw, 50vw"
      />
      <figcaption>
        Imagem conceitual · substituir por fotografia autorizada
      </figcaption>
    </figure>
  );
}
export function ContactLinks({ model }: { model: ClinicModel }) {
  return (
    <div className="contactLinks">
      {model.whatsappUrl && (
        <a
          className="cta"
          href={model.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Conversar pelo WhatsApp ↗
        </a>
      )}
      {model.telephone && (
        <a className="textLink" href={model.telephone}>
          Ligar: {model.phone}
        </a>
      )}
      {model.instagramUrl && (
        <a
          className="textLink"
          href={model.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Instagram ↗
        </a>
      )}
      {model.websiteUrl && (
        <a
          className="textLink"
          href={model.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Site informado pela clínica ↗
        </a>
      )}
      {!model.whatsappUrl &&
        !model.telephone &&
        !model.instagramUrl &&
        !model.websiteUrl && (
          <p>Os canais de contato serão apresentados após confirmação.</p>
        )}
      {model.whatsapp && !model.whatsappUrl && (
        <p>
          WhatsApp informado: {model.whatsapp}. Confirme o código internacional
          para habilitar o link.
        </p>
      )}
    </div>
  );
}
export function Location({ model }: { model: ClinicModel }) {
  if (!model.maps) return null;
  return (
    <section id="localizacao" className="location">
      <div>
        <span className="eyebrow">Onde encontrar</span>
        <h2>Mais perto de você.</h2>
      </div>
      <div>
        <p>{model.location}</p>
        <a
          className="textLink"
          href={model.maps}
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar localização no mapa ↗
        </a>
      </div>
    </section>
  );
}
export function Footer({ model }: { model: ClinicModel }) {
  return (
    <footer>
      <strong>{model.name}</strong>
      <p>Demonstração conceitual desenvolvida pela Loung Tech.</p>
      <a href="#inicio">Voltar ao início ↑</a>
    </footer>
  );
}
