import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { FreightRequest } from "@/src/lib/db/types";

export default async function RequestsPage() {
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

  const { data: rows, error } = await supabase
    .from("freight_requests")
    .select(
      "id, company_id, created_by, status, origin_city, origin_state, destination_city, destination_state, cargo_description, weight_kg, volume_m3, selected_quote_id, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  const requests = (rows ?? []) as FreightRequest[];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Solicitações de frete
          </h1>
          <p className="text-sm text-slate-600">
            Solicitações criadas pela sua empresa.
          </p>
        </div>

        <Link href="/app/requests/new">
          <Button>Nova solicitação</Button>
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Não foi possível carregar as solicitações.
        </div>
      ) : null}

      {requests.length === 0 && !error ? (
        <Card>
          <p className="text-sm text-slate-700">
            Nenhuma solicitação ainda. Crie a primeira para receber propostas.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {requests.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium text-slate-900">
                  {r.origin_city}/{r.origin_state} → {r.destination_city}/{r.destination_state}
                </div>
                <div className="text-xs text-slate-500">
                  Status: <span className="font-medium">{r.status}</span>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Criada em {new Date(r.created_at).toLocaleDateString("pt-BR")}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
