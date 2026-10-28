import { resolveAccess, type AccessPort } from "./access";
export interface Credentials {
  email: string;
  password: string;
}
export interface AuthFlowPort extends AccessPort {
  signIn(credentials: Credentials): Promise<boolean>;
  signOut(): Promise<boolean>;
}
export type LoginResult = { ok: true } | { ok: false; message: string };
export function parseCredentials(
  form: Pick<FormData, "get">,
): Credentials | null {
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || typeof password !== "string") return null;
  const normalized = email.trim();
  if (
    normalized.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
    password.length === 0 ||
    password.length > 1024
  )
    return null;
  return { email: normalized, password };
}
export async function loginWithPassword(
  port: AuthFlowPort,
  credentials: Credentials,
): Promise<LoginResult> {
  try {
    if (!(await port.signIn(credentials)))
      return {
        ok: false,
        message:
          "Não foi possível entrar. Verifique seus dados ou tente novamente mais tarde.",
      };
    const access = await resolveAccess(port);
    if (access.status === "authorized") return { ok: true };
    await port.signOut();
    return {
      ok: false,
      message:
        access.status === "forbidden"
          ? "Sua conta não possui acesso ao Studio. Solicite autorização à Loung Tech."
          : "Não foi possível validar seu acesso. Tente novamente em instantes.",
    };
  } catch {
    return {
      ok: false,
      message:
        "O serviço de acesso está indisponível. Tente novamente em instantes.",
    };
  }
}
export async function logoutSession(
  port: Pick<AuthFlowPort, "signOut">,
): Promise<LoginResult> {
  try {
    return (await port.signOut())
      ? { ok: true }
      : {
          ok: false,
          message: "Não foi possível encerrar a sessão. Tente novamente.",
        };
  } catch {
    return {
      ok: false,
      message: "Não foi possível encerrar a sessão. Tente novamente.",
    };
  }
}
