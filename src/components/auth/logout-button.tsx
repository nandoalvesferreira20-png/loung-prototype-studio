"use client";
import { useActionState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
export function LogoutButton() {
  const [state, action, pending] = useActionState(logoutAction, {
    message: "",
  });
  return (
    <form action={action} className="logout-form">
      <button
        className="help-button logout-button"
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? (
          <LoaderCircle size={17} className="spin" />
        ) : (
          <LogOut size={17} />
        )}{" "}
        {pending ? "Saindo..." : "Sair do Studio"}
      </button>
      {state.message && <p role="alert">{state.message}</p>}
    </form>
  );
}
