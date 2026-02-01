import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
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
    <div className="space-y-4">
      <PageHeader
        title="Nova solicitação"
        subtitle="Preencha os dados para receber propostas. Leva menos de 2 minutos."
        cta={
          <Link href="/app/solicitacoes">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}

      <Card className="space-y-4">
        <form action={criarSolicitacao} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Origem</h2>
              <span className="text-xs text-slate-500">
                Campos obrigatórios marcados com <span className="text-red-600">*</span>
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="origin_zip">
                  CEP <span className="text-red-600">*</span>
                </label>
                <Input id="origin_zip" name="origin_zip" required placeholder="01001-000" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="origin_city">
                  Cidade <span className="text-red-600">*</span>
                </label>
                <Input id="origin_city" name="origin_city" required placeholder="São Paulo" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="origin_state">
                  UF <span className="text-red-600">*</span>
                </label>
                <Input id="origin_state" name="origin_state" required placeholder="SP" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Destino</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="destination_zip">
                  CEP <span className="text-red-600">*</span>
                </label>
                <Input id="destination_zip" name="destination_zip" required placeholder="20040-010" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="destination_city">
                  Cidade <span className="text-red-600">*</span>
                </label>
                <Input id="destination_city" name="destination_city" required placeholder="Rio de Janeiro" />
              </div>
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="destination_state">
                  UF <span className="text-red-600">*</span>
                </label>
                <Input id="destination_state" name="destination_state" required placeholder="RJ" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Carga</h2>
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
                <Input id="weight_kg" name="weight_kg" inputMode="decimal" placeholder="Ex: 1200" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="length_cm">
                  Comprimento (cm)
                </label>
                <Input id="length_cm" name="length_cm" inputMode="numeric" placeholder="Ex: 120" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="width_cm">
                  Largura (cm)
                </label>
                <Input id="width_cm" name="width_cm" inputMode="numeric" placeholder="Ex: 80" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="height_cm">
                  Altura (cm)
                </label>
                <Input id="height_cm" name="height_cm" inputMode="numeric" placeholder="Ex: 100" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="cargo_description">
                Observações (opcional)
              </label>
              <Input id="cargo_description" name="cargo_description" placeholder="Ex: coleta após 14h" />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Coleta e nota</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="pickup_date">
                  Data de coleta <span className="text-red-600">*</span>
                </label>
                <Input id="pickup_date" name="pickup_date" type="date" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="invoice_value">
                  Valor da nota (R$)
                </label>
                <Input id="invoice_value" name="invoice_value" inputMode="decimal" placeholder="Ex: 15.000,00" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="submit">Criar solicitação</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
