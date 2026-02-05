import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Button } from "@/components/Button";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Fallback (produção): se o Supabase cair no Site URL (/) com ?code=...
  // a home captura e envia para /auth/callback, que troca code -> session.
  if (searchParams) {
    const sp = await searchParams;
    const code = typeof sp.code === "string" ? sp.code : null;
    if (code) {
      redirect(`/auth/callback?code=${encodeURIComponent(code)}&next=/app/cotacoes`);
    }
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  const isLoggedIn = !!user;
  const primaryHref = isLoggedIn ? "/app/cotacoes/nova" : "/login";
  const primaryLabel = isLoggedIn ? "Nova cotação" : "Entrar";

  const secondaryHref = isLoggedIn ? "/app/cotacoes" : "/signup";
  const secondaryLabel = isLoggedIn ? "Minhas cotações" : "Criar conta";

  // Se já estiver logado, a home pode ser apenas um “gate” simples.
  // Mantemos a home como landing clean (sem redirecionar automaticamente).
  if (!supabase) {
    // Sem config, mantém a home acessível e leva para /login.
  }

  return (
    <div className="bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-sky-700" aria-hidden />
            <div className="text-sm font-semibold text-slate-900">RotaClick</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={primaryHref}>
              <Button>{primaryLabel}</Button>
            </Link>
            <Link href={secondaryHref}>
              <Button variant="secondary">{secondaryLabel}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cotação automática
              </div>

              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Cotação online de frete, automática por CEP
              </h1>

              <p className="text-base leading-relaxed text-slate-700 sm:text-lg">
                Compare opções por tabela e APIs de transportadoras. Feche a cotação em segundos.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href={primaryHref}>
                  <Button>{primaryLabel}</Button>
                </Link>
                <Link href={secondaryHref}>
                  <Button variant="secondary">{secondaryLabel}</Button>
                </Link>
              </div>

              <div className="pt-4 text-sm text-slate-600">
                Ambiente B2B com autenticação e acesso por perfis.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">Exemplo de cotação</div>
              <div className="mt-1 text-sm text-slate-600">SP → RJ • 0–100 kg</div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Opções calculadas
                </div>
                <div className="divide-y divide-slate-200">
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">Transportadora A</div>
                      <div className="text-xs text-slate-500">Prazo 3d • Tabela</div>
                    </div>
                    <div className="font-semibold text-slate-900">R$ 150,00</div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium text-slate-900">Transportadora B</div>
                      <div className="text-xs text-slate-500">Prazo 4d • Tabela</div>
                    </div>
                    <div className="font-semibold text-slate-900">R$ 165,00</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Sem marketing exagerado. Foco em operação.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
