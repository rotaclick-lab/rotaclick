import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
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
    <div className="space-y-4">
      <PageHeader
        title="Solicitações (antigo)"
        subtitle="Mantido por compatibilidade. Prefira a área /solicitacoes."
        cta={
          <Link href="/app/requests/new">
            <Button>Nova solicitação</Button>
          </Link>
        }
      />

      {error ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar as solicitações."
          description="Tente recarregar a página."
        />
      ) : null}

      {requests.length === 0 && !error ? (
        <Feedback
          variant="info"
          title="Nenhuma solicitação ainda"
          description="Crie a primeira para receber propostas."
        />
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
                  Status: <StatusBadge kind="request" status={r.status} />
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
