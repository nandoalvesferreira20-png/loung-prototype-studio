import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone-error">
      <p className="eyebrow">404 · LOUNG STUDIO</p>
      <h1>Este caminho ainda não existe.</h1>
      <p>Volte ao workspace para continuar explorando.</p>
      <Link className="button primary" href="/dashboard">
        Voltar ao dashboard
      </Link>
    </main>
  );
}
