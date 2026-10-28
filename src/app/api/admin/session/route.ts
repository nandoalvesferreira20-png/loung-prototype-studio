import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/server";
import { AccessDeniedError } from "@/lib/auth/access";
export const dynamic = "force-dynamic";
// Endpoint mínimo para verificar a sessão. Nenhum dado de leads é exposto.
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(
      { authorized: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const status =
      error instanceof AccessDeniedError
        ? error.reason === "unauthenticated"
          ? 401
          : error.reason === "forbidden"
            ? 403
            : 503
        : 503;
    return NextResponse.json(
      { error: "Acesso administrativo indisponível ou não autorizado." },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
