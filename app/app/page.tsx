import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function AppPage() {
  const supabase = await createSupabaseServerClient();

  // Se ainda não configurou o .env.local, manda para /login (lá mostramos o aviso)
  if (!supabase) {
    redirect("/login");
  }

  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  async function signOut() {
    "use server";

    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      redirect("/login");
    }

    await supabase.auth.signOut();
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // Se o profile não existir / não estiver acessível (RLS), o dashboard fica sem links.
  // Mostramos uma mensagem explícita para facilitar o diagnóstico em produção.
  const showProfileWarning = !profile?.role;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Bem-vindo ao RotaClick
          </h1>
          <p className="text-sm text-slate-600">Este é um placeholder do dashboard.</p>
        </div>

        {showProfileWarning ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Não consegui carregar seu <strong>perfil</strong> (role) no banco. Sem isso, os
            links do dashboard não aparecem.
            <div className="mt-2 text-xs text-amber-800">
              <div>
                <strong>User ID:</strong> {data.user.id}
              </div>
              <div>
                <strong>Dica:</strong> confira se existe uma linha em <code>public.profiles</code>
                com esse <code>id</code> e se as policies de RLS permitem <code>SELECT</code> do
                próprio usuário.
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {profile?.role === "ADMIN" || profile?.role === "CLIENTE" ? (
            <Link href="/app/requests">
              <Button>Ver solicitações</Button>
            </Link>
          ) : null}

          {profile?.role === "TRANSPORTADOR" ? (
            <Link href="/app/carrier/requests">
              <Button>Ver solicitações abertas</Button>
            </Link>
          ) : null}
        </div>

        <form action={signOut}>
          <Button type="submit">Sair</Button>
        </form>
      </Card>
    </div>
  );
}
