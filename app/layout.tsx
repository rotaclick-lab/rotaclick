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
      <body className="min-h-dvh bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <div className="text-base font-semibold tracking-tight text-brand-secondary">
              <span className="text-brand-primary">Rota</span>Click
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
