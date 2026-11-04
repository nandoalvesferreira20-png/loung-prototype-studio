"use client";
import { useState } from "react";
const widths = [360, 390, 768, 1024, 1440] as const;
export function PreviewFrame({
  id,
  revision,
}: {
  id: string;
  revision: number;
}) {
  const [width, setWidth] = useState<number>(1440);
  const [refresh, setRefresh] = useState(0);
  const src = `/preview/prototipos/${id}?revision=${revision}&refresh=${refresh}`;
  return (
    <section aria-label="Prévia do site">
      <div className="preview-toolbar">
        <label>
          Largura do site{" "}
          <select
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
          >
            {widths.map((w) => (
              <option key={w} value={w}>
                {w}px {w < 768 ? "· mobile" : "· desktop / tablet"}
              </option>
            ))}
          </select>
        </label>
        <button className="button" onClick={() => setRefresh((v) => v + 1)}>
          Recarregar dados salvos
        </button>
        <a
          className="button primary"
          href={src}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir página completa ↗
        </a>
      </div>
      <p className="preview-note">
        Prévia privada. A área abaixo mantém a largura selecionada; role
        horizontalmente para inspecionar telas maiores.
      </p>
      <div className="preview-stage">
        <iframe
          key={src}
          src={src}
          title="Site conceitual — prévia privada"
          style={{
            width,
            minWidth: width,
            height: "80dvh",
            border: 0,
            background: "white",
          }}
        />
      </div>
    </section>
  );
}
