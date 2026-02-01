import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { criarSolicitacao } from "./actions";

export default async function NovaSolicitacaoPage() {
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
    <div className="mx-auto max-w-2xl">
      <Card className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Nova solicitação
          </h1>
          <p className="text-sm text-slate-600">
            Preencha os dados abaixo para receber propostas.
          </p>
        </div>

        {errorText ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errorText}
          </div>
        ) : null}

        <form action={criarSolicitacao} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_zip">
                Origem — CEP <span className="text-red-600">*</span>
              </label>
              <Input id="origin_zip" name="origin_zip" required placeholder="00000-000" />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_city">
                Origem — Cidade <span className="text-red-600">*</span>
              </label>
              <Input id="origin_city" name="origin_city" required placeholder="São Paulo" />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="origin_state">
                Origem — UF <span className="text-red-600">*</span>
              </label>
              <Input
                id="origin_state"
                name="origin_state"
                required
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_zip">
                Destino — CEP <span className="text-red-600">*</span>
              </label>
              <Input id="destination_zip" name="destination_zip" required placeholder="00000-000" />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_city">
                Destino — Cidade <span className="text-red-600">*</span>
              </label>
              <Input id="destination_city" name="destination_city" required placeholder="Campinas" />
            </div>
            <div className="space-y-1 sm:col-span-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="destination_state">
                Destino — UF <span className="text-red-600">*</span>
              </label>
              <Input
                id="destination_state"
                name="destination_state"
                required
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="cargo_type">
                Tipo de carga <span className="text-red-600">*</span>
              </label>
              <Input id="cargo_type" name="cargo_type" required placeholder="Ex: Paletizada" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="weight_kg">
                Peso (kg)
              </label>
              <Input id="weight_kg" name="weight_kg" inputMode="decimal" placeholder="ex: 1200" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="length_cm">
                Comprimento (cm)
              </label>
              <Input id="length_cm" name="length_cm" inputMode="numeric" placeholder="ex: 120" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="width_cm">
                Largura (cm)
              </label>
              <Input id="width_cm" name="width_cm" inputMode="numeric" placeholder="ex: 80" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="height_cm">
                Altura (cm)
              </label>
              <Input id="height_cm" name="height_cm" inputMode="numeric" placeholder="ex: 100" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="invoice_value">
                Valor da nota (R$)
              </label>
              <Input
                id="invoice_value"
                name="invoice_value"
                inputMode="decimal"
                placeholder="ex: 15.000,00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="pickup_date">
                Data de coleta <span className="text-red-600">*</span>
              </label>
              <Input id="pickup_date" name="pickup_date" type="date" required />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="cargo_description">
              Observações / descrição
            </label>
            <Input
              id="cargo_description"
              name="cargo_description"
              placeholder="Opcional (ex: coleta após 14h)"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="submit">Criar solicitação</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
