"use client";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction } from "@/app/login/actions";
export function LoginForm({
  configured,
  initialMessage,
}: {
  configured: boolean;
  initialMessage: string;
}) {
  const [state, action, pending] = useActionState(loginAction, { message: "" });
  return (
    <form action={action} className="login-form">
      <label htmlFor="email">E-mail</label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="username"
        placeholder="seuemail@loungtech.com"
        maxLength={254}
        required
        disabled={!configured || pending}
      />
      <label htmlFor="password">Senha</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Sua senha"
        maxLength={1024}
        required
        disabled={!configured || pending}
      />
      <div className="login-feedback" role="status" aria-live="polite">
        {state.message || initialMessage}
      </div>
      <button
        className="button primary"
        disabled={!configured || pending}
        aria-busy={pending}
      >
        {pending ? (
          <>
            <LoaderCircle size={17} className="spin" />
            Entrando...
          </>
        ) : (
          <>
            Entrar no Studio
            <ArrowRight size={17} />
          </>
        )}
      </button>
      <p className="login-contact">
        Acesso exclusivo para integrantes autorizados da Loung Tech.
        <br />
        Para obter acesso, fale com o responsável pelo Studio.
      </p>
    </form>
  );
}
