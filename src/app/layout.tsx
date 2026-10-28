import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Loung Prototype Studio", template: "%s · Loung Studio" },
  description: "Studio de protótipos da Loung Tech. Acesso interno — Fase 2.1.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
