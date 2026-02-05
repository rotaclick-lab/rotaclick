import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Feedback } from "@/components/Feedback";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { SignUpForm } from "./SignUpForm";

export default async function SignUpPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-10">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="secondary">Voltar</Button>
          </Link>
        </div>

        <Feedback
          variant="warning"
          title="Cadastro desabilitado (configuração ausente)"
          description="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (local) ou nas variáveis da Vercel (produção)."
        />
      </div>
    );
  }

  const { data } = await supabase.auth.getUser();
  if (data.user) {
    redirect("/app/cotacoes");
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem-5rem)] items-center justify-center py-10">
      <div className="w-full max-w-md space-y-4 px-4">
        <div className="flex items-center justify-between">
          <Link href="/">
            <Button variant="secondary">Voltar</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">Já tenho conta</Button>
          </Link>
        </div>

        <SignUpForm />

        <div className="text-center text-xs text-slate-500">
          Ao criar uma conta, você receberá um e-mail para confirmar o endereço.
        </div>
      </div>
    </div>
  );
}
