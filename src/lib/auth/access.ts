// Núcleo independente do framework. Não confia em getSession(), cookies ou user_metadata.
export interface AuthIdentity {
  id: string;
  email?: string;
}
export interface AccessPort {
  currentUser(): Promise<AuthIdentity | null>;
  isAdmin(userId: string): Promise<boolean>;
}
export type AccessResult =
  | { status: "authorized"; user: AuthIdentity }
  | { status: "unauthenticated" | "forbidden" | "unavailable" };
export async function resolveAccess(port: AccessPort): Promise<AccessResult> {
  try {
    const user = await port.currentUser();
    if (!user) return { status: "unauthenticated" };
    if (!(await port.isAdmin(user.id))) return { status: "forbidden" };
    return { status: "authorized", user };
  } catch {
    return { status: "unavailable" };
  }
}
export class AccessDeniedError extends Error {
  constructor(
    public readonly reason: Exclude<AccessResult["status"], "authorized">,
  ) {
    super("Acesso administrativo não autorizado.");
    this.name = "AccessDeniedError";
  }
}
export function assertAdminAccess(
  access: AccessResult,
): asserts access is Extract<AccessResult, { status: "authorized" }> {
  if (access.status !== "authorized")
    throw new AccessDeniedError(access.status);
}
