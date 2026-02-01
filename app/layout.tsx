import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RotaClick",
  description: "Cotação de frete B2B em minutos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
