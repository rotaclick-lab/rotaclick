import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Configure as variáveis <strong>NEXT_PUBLIC_SUPABASE_URL</strong> e{" "}
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong> em <strong>.env.local</strong>
          para habilitar o login.
        </div>
      </div>
    );
  }

  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect("/app");
  }

  return (
    <div className="py-6">
      <LoginForm />
    </div>
  );
}
