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

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Bem-vindo ao RotaClick
          </h1>
          <p className="text-sm text-slate-600">Este é um placeholder do dashboard.</p>
        </div>

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
          <Button variant="secondary">Sair</Button>
        </form>
      </Card>
    </div>
  );
}
