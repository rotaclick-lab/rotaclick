import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { createFreightRequest } from "./actions";

export default async function NewFreightRequestPage() {
  const h = await headers();
  const url = new URL(h.get("x-url") ?? "http://localhost");
  const errorText = url.searchParams.get("error");

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "CLIENTE")) {
    redirect("/app");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Nova solicitação de frete
          </h1>
          <p className="text-sm text-slate-600">
            Preencha os dados básicos para receber propostas.
          </p>
        </div>

        {errorText ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorText}
          </div>
        ) : null}

        {/* Server Action */}
        <form action={createFreightRequest} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_city">
                Cidade de origem
              </label>
              <Input id="origin_city" name="origin_city" required placeholder="São Paulo" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_state">
                UF de origem
              </label>
              <Input id="origin_state" name="origin_state" required placeholder="SP" maxLength={2} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_city">
                Cidade de destino
              </label>
              <Input id="destination_city" name="destination_city" required placeholder="Campinas" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_state">
                UF de destino
              </label>
              <Input id="destination_state" name="destination_state" required placeholder="SP" maxLength={2} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="cargo_description">
              Descrição da carga (opcional)
            </label>
            <Input id="cargo_description" name="cargo_description" placeholder="Ex: caixas, paletizado, etc." />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="weight_kg">
                Peso (kg) (opcional)
              </label>
              <Input id="weight_kg" name="weight_kg" inputMode="decimal" placeholder="1200" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="volume_m3">
                Volume (m³) (opcional)
              </label>
              <Input id="volume_m3" name="volume_m3" inputMode="decimal" placeholder="8.5" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="submit">Criar solicitação</Button>
          </div>
        </form>
      </Card>

      <p className="mt-4 text-xs text-slate-500">
        Neste MVP, a solicitação é criada como <strong>OPEN</strong>.
      </p>
    </div>
  );
}
