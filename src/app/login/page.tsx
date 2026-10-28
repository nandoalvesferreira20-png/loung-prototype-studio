import { redirect } from "next/navigation";
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import { getAdminAccess } from "@/lib/auth/server";
import { getSupabaseConfig } from "@/config/supabase";
import { LoginForm } from "@/components/auth/login-form";
export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const configured = Boolean(getSupabaseConfig());
  const access = await getAdminAccess();
  if (access.status === "authorized") redirect("/dashboard");
  const { reason } = await searchParams;
  const message = !configured
    ? "O acesso está aguardando configuração do Supabase. Nenhum login está disponível neste ambiente."
    : access.status === "forbidden" || reason === "forbidden"
      ? "Sua conta não possui autorização administrativa. Solicite acesso ao responsável da Loung Tech."
      : access.status === "unavailable" || reason === "unavailable"
        ? "Não foi possível verificar o serviço de acesso. Tente novamente em instantes."
        : "";
  return (
    <div className="login-page">
      <section className="login-brand-panel">
        <div className="brand">
          <span className="brand-symbol">
            l<span>↗</span>
          </span>
          <div>
            <b>
              loung<span className="brand-period">.</span>
            </b>
            <small>PROTOTYPE STUDIO</small>
          </div>
        </div>
        <div className="login-brand-copy">
          <span className="banner-kicker">IDEIAS EM MOVIMENTO</span>
          <h1>
            O próximo projeto.
            <br />A próxima possibilidade.
          </h1>
          <p>
            Um Studio para transformar oportunidades em primeiras impressões que
            conectam.
          </p>
          <ArrowUpRight size={60} />
        </div>
        <span className="login-copyright">© 2026 Loung Tech</span>
      </section>
      <main className="login-content">
        <div className="login-card">
          <span className="login-lock">
            <LockKeyhole size={22} />
          </span>
          <p className="eyebrow">BEM-VINDO AO SEU STUDIO</p>
          <h2>Boas ideias começam aqui.</h2>
          <p className="subtitle">Entre com sua conta para continuar.</p>
          <LoginForm configured={configured} initialMessage={message} />
        </div>
        <p className="login-bottom">Loung Tech · Acesso interno</p>
      </main>
    </div>
  );
}
