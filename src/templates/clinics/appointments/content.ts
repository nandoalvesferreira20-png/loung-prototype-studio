import type { ClinicModel } from "../shared/adapter";
import type { AppointmentPhoto } from "../../../lib/generation/appointments-design";
import { clinicDefaultPhoto } from "../shared/default-photography";
export function appointmentContent(m: ClinicModel) {
  const d = m.design?.appointments;
  const oldHeadline =
    m.illustrative.headline ===
    "Um espaço para apresentar cuidado e atendimento";
  const titleBySpecialty = {
    general: "Sua saúde merece atenção em cada detalhe.",
    dentistry: "Seu sorriso merece atenção em cada detalhe.",
    aesthetics: "Conheça as possibilidades de cuidado para você.",
    psychology: "Encontre informações para dar o seu próximo passo.",
    physiotherapy: "Conheça os caminhos para o cuidado com seu movimento.",
    veterinary: "O cuidado com seu pet começa com uma conversa.",
  };
  return {
    headline:
      d?.heroTitle ||
      (oldHeadline ? titleBySpecialty[m.specialtyId] : m.illustrative.headline),
    description:
      d?.heroDescription ||
      m.design?.heroDescription ||
      `Conheça ${m.name}, consulte os serviços informados e fale diretamente com a clínica para saber mais.`,
    about:
      d?.aboutDescription ||
      m.description ||
      (m.illustrative.introduction.startsWith(
        "Texto-base demonstrativo para organizar as informações da clínica.",
      )
        ? `Conheça ${m.name}, encontre as informações que procura e escolha um dos canais disponíveis para conversar sobre o atendimento.`
        : m.illustrative.introduction),
  };
}
export function appointmentPhotos(m: ClinicModel) {
  const d = m.design?.appointments;
  const fallback = (
    file: string,
    caption: string,
    override: string | null | undefined,
  ): AppointmentPhoto => ({
    src:
      override !== undefined
        ? override
        : clinicDefaultPhoto(file, m.specialtyId).src,
    caption:
      override !== undefined || m.specialtyId === "general"
        ? caption
        : clinicDefaultPhoto(file, m.specialtyId).caption,
    illustrative: true,
    position: "center",
  });
  return {
    hero:
      d?.heroImage ??
      fallback(
        "doctor-consultation-main",
        "Situação ilustrativa de atendimento",
        m.design?.images?.hero,
      ),
    about:
      d?.aboutImage ??
      fallback(
        "clinic-reception-hero",
        "Referência visual de recepção",
        m.design?.images?.institutional,
      ),
    gallery: d?.gallery ?? [
      fallback(
        "clinic-reception-hero",
        "Recepção · referência de ambiente",
        undefined,
      ),
      fallback(
        "clinic-room-structure",
        "Consultório · referência de ambiente",
        m.design?.images?.room,
      ),
      fallback(
        "consultation-detail",
        "Detalhe de atendimento · referência visual",
        m.design?.images?.detail,
      ),
    ],
  };
}
