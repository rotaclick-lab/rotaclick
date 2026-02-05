import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { createQuoteFromForm } from "../actions";

export default async function NovaCotacaoPage() {
  const h = await headers();
  const url = new URL(h.get("x-url") ?? "http://localhost");
  const errorText = url.searchParams.get("error");

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "CLIENTE")) {
    redirect("/app");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Nova cotação"
        subtitle="Informe CEP origem/destino e peso para receber opções calculadas."
        cta={
          <Link href="/app/cotacoes">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}
      <form
        action={createQuoteFromForm}
        className="space-y-3"
      >
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_zip">
                CEP de origem
              </label>
              <Input id="origin_zip" name="origin_zip" placeholder="01001-000" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_zip">
                CEP de destino
              </label>
              <Input id="destination_zip" name="destination_zip" placeholder="20040-020" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="weight_kg">
                Peso (kg)
              </label>
              <Input id="weight_kg" name="weight_kg" inputMode="decimal" placeholder="120" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="cargo_type">
                Tipo de carga (opcional)
              </label>
              <Input id="cargo_type" name="cargo_type" placeholder="Ex: Paletizado" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="length_cm">
                Comprimento (cm) (opcional)
              </label>
              <Input id="length_cm" name="length_cm" inputMode="numeric" placeholder="120" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="width_cm">
                Largura (cm) (opcional)
              </label>
              <Input id="width_cm" name="width_cm" inputMode="numeric" placeholder="80" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="height_cm">
                Altura (cm) (opcional)
              </label>
              <Input id="height_cm" name="height_cm" inputMode="numeric" placeholder="100" />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end">
          <Button type="submit">Gerar cotação</Button>
        </div>
      </form>
    </div>
  );
}
