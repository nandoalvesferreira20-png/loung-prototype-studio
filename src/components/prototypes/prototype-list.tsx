"use client";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { niches, templates, publicationLabels } from "@/config/catalog";
import { demoPrototypes } from "@/data/demo";
import { filterPrototypes, type PrototypeFilters } from "@/lib/prototypes";
import { PrototypeTable } from "./prototype-table";
const initial: PrototypeFilters = {
  query: "",
  niche: "",
  status: "",
  template: "",
};
export function PrototypeList() {
  const [filters, setFilters] = useState<PrototypeFilters>(initial);
  const items = filterPrototypes(demoPrototypes, filters);
  const filtered = Object.values(filters).some(Boolean);
  return (
    <section className="panel">
      <div className="filter-bar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar empresa ou especialidade"
            placeholder="Buscar empresa ou especialidade..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          />
        </label>
        <span className="filter-icon">
          <SlidersHorizontal size={17} />
        </span>
        <select
          aria-label="Filtrar por nicho"
          value={filters.niche}
          onChange={(e) =>
            setFilters({
              ...filters,
              niche: e.target.value as PrototypeFilters["niche"],
            })
          }
        >
          <option value="">Todos os nichos</option>
          {niches.map((n) => (
            <option value={n.id} key={n.id}>
              {n.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por status"
          value={filters.status}
          onChange={(e) =>
            setFilters({
              ...filters,
              status: e.target.value as PrototypeFilters["status"],
            })
          }
        >
          <option value="">Todos os status</option>
          {Object.entries(publicationLabels).map(([id, label]) => (
            <option value={id} key={id}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Filtrar por template"
          value={filters.template}
          onChange={(e) =>
            setFilters({
              ...filters,
              template: e.target.value as PrototypeFilters["template"],
            })
          }
        >
          <option value="">Todos os templates</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.variant}
            </option>
          ))}
        </select>
      </div>
      <div className="results-bar">
        <span aria-live="polite">
          {items.length} de {demoPrototypes.length} protótipos demonstrativos
        </span>
        {filtered && (
          <button className="text-link" onClick={() => setFilters(initial)}>
            <X size={14} />
            Limpar filtros
          </button>
        )}
        <span className="small muted">
          Visualizar, editar e publicar: em breve
        </span>
      </div>
      <PrototypeTable items={items} />
    </section>
  );
}
