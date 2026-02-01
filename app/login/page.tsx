import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/Button";
import { Feedback } from "@/components/Feedback";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-44 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -top-28 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="absolute bottom-[-12rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-3xl" />
        </div>

        <div className="mx-auto max-w-md space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </div>

          <Feedback
            variant="warning"
            title="Login desabilitado (configuração ausente)"
            description="Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local (local) ou nas variáveis da Vercel (produção)."
          />
        </div>
      </div>
    );
  }

  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-44 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-sky-200/60 blur-3xl" />
        <div className="absolute -top-28 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-indigo-200/60 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="flex min-h-[calc(100dvh-3.5rem-5rem)] items-center justify-center py-10">
        <div className="w-full max-w-md space-y-4 px-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="secondary">Voltar</Button>
            </Link>
          </div>

          <LoginForm />

          <div className="text-center text-xs text-slate-500">
            Precisa de acesso? Fale com o administrador da sua empresa.
          </div>
        </div>
      </div>
    </div>
  );
}
