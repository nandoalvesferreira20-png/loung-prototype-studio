import Image from "next/image";
import { studioBrand } from "@/config/brand";
export function StudioBrand({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`studio-brand${compact ? " is-compact" : ""}`}>
      <Image
        src={studioBrand.logo}
        alt={compact ? "Loung Tech" : "Símbolo oficial LT"}
        width={52}
        height={52}
        priority
      />
      <span className="studio-brand-copy">
        <strong>{studioBrand.name}</strong>
        <small>{studioBrand.product}</small>
      </span>
    </span>
  );
}
