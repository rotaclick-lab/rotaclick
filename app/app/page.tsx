import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  // Se o profile não existir / não estiver acessível (RLS), o dashboard fica sem links.
  // Mostramos uma mensagem explícita para facilitar o diagnóstico em produção.
  const showProfileWarning = !profile?.role;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Bem-vindo ao RotaClick"
        subtitle="Escolha uma opção abaixo para continuar."
      />

      {showProfileWarning ? (
        <Feedback
          variant="warning"
          title="Não consegui carregar seu perfil (role) no banco"
          description="Sem isso, os links do dashboard não aparecem."
        />
      ) : null}

      {showProfileWarning ? (
        <Card className="space-y-2">
          <div className="text-xs text-slate-600">
            <div>
              <strong>User ID:</strong> {data.user.id}
            </div>
            {profileError ? (
              <div>
                <strong>Erro do Supabase:</strong>{" "}
                <span className="font-mono">
                  {profileError.code ? `${profileError.code}: ` : ""}
                  {profileError.message}
                </span>
              </div>
            ) : null}
            <div>
              <strong>Dica:</strong> confira se existe uma linha em <code>public.profiles</code>
              com esse <code>id</code> e se as policies de RLS permitem <code>SELECT</code> do
              próprio usuário.
            </div>
          </div>
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {profile?.role === "ADMIN" || profile?.role === "CLIENTE" ? (
          <Link href="/app/solicitacoes">
            <Button>Solicitações da minha empresa</Button>
          </Link>
        ) : null}

        {profile?.role === "TRANSPORTADOR" ? (
          <Link href="/carrier/solicitacoes">
            <Button>Solicitações abertas (transportador)</Button>
          </Link>
        ) : null}
      </div>

      <form action={signOut}>
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </div>
  );
}
