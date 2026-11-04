import type { ClinicModel } from "../shared/adapter";

// Apresentação visual da variante A. Não altera o snapshot nem a variante B.
const oldHeadline = "Um espaço para apresentar cuidado e atendimento";
const oldIntroduction =
  "Texto-base demonstrativo para organizar as informações da clínica. Especialidades, equipe e atendimentos precisam ser confirmados pela empresa.";
export function premiumContent(model: ClinicModel) {
  return {
    headline:
      model.illustrative.headline === oldHeadline
        ? model.specialtyId === "veterinary"
          ? "O cuidado com seu pet começa com uma conversa."
          : "Seu cuidado merece uma boa conversa."
        : model.illustrative.headline,
    introduction:
      model.illustrative.introduction === oldIntroduction
        ? "Cada pessoa chega com uma história e uma necessidade. Conheça a clínica, encontre as informações que procura e escolha a melhor forma de entrar em contato."
        : model.illustrative.introduction,
  };
}
