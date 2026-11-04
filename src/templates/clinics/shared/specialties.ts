const optionalSections = ["services", "location", "instagram"] as const;
export const specialties = {
  dentistry: {
    optionalSections,
    label: "Odontologia",
    pattern: /odont|dentist/,
    direction: "Formas minerais e curvas suaves",
    category: "ambiente odontológico",
    icon: "◇",
    accent: "#d8dfd2",
    copy: "Uma apresentação dedicada ao atendimento odontológico.",
  },
  aesthetics: {
    optionalSections,
    label: "Estética",
    pattern: /estetic/,
    direction: "Volumes escultóricos e tons de argila",
    category: "texturas e ambiente de estética",
    icon: "✧",
    accent: "#e7d7cb",
    copy: "Um olhar cuidadoso para apresentar a sua clínica.",
  },
  psychology: {
    optionalSections,
    label: "Psicologia",
    pattern: /psicol/,
    direction: "Luz difusa, discrição e espaço",
    category: "ambiente de acolhimento",
    icon: "○",
    accent: "#dad8e4",
    copy: "Um espaço de apresentação com tempo para a leitura.",
  },
  physiotherapy: {
    optionalSections,
    label: "Fisioterapia",
    pattern: /fisio/,
    direction: "Linhas em movimento e verde suave",
    category: "movimento abstrato",
    icon: "↗",
    accent: "#d2e1d8",
    copy: "Informações claras para aproximar você do atendimento.",
  },
  veterinary: {
    optionalSections,
    label: "Veterinária",
    pattern: /veterin/,
    direction: "Formas orgânicas inspiradas na natureza",
    category: "natureza e cuidado animal",
    icon: "♧",
    accent: "#dce1c6",
    copy: "Uma apresentação pensada para o universo veterinário.",
  },
  general: {
    optionalSections,
    label: "Clínica",
    pattern: /./,
    direction: "Arquitetura serena e luz natural",
    category: "ambiente clínico abstrato",
    icon: "+",
    accent: "#dedbd0",
    copy: "Conheça as informações da clínica e encontre uma forma de contato.",
  },
} as const;
export type SpecialtyId = keyof typeof specialties;
export function resolveSpecialty(value: string | null): SpecialtyId {
  const normalized = (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return (
    (Object.keys(specialties) as SpecialtyId[]).find(
      (key) => key !== "general" && specialties[key].pattern.test(normalized),
    ) ?? "general"
  );
}
