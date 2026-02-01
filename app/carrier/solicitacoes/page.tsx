import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";

type OpenRequest = {
  id: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  cargo_type: string | null;
  pickup_date: string | null;
  created_at: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  selected_quote_id: string | null;
};

type MyQuote = {
  id: string;
  freight_request_id: string;
  price_cents: number;
  deadline_days: number;
  status: "SENT" | "WITHDRAWN" | "WON" | "LOST";
  created_at: string;
};

function formatMoneyBRLFromCents(cents: number) {
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CarrierSolicitacoesPage() {
  const h = await headers();
  const url = new URL(h.get("x-url") ?? "http://localhost");
  const errorText = url.searchParams.get("error");
  const successText = url.searchParams.get("success");

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

  if (!profile || profile.role !== "TRANSPORTADOR") {
    redirect("/app");
  }

  // Transportador vê requests OPEN por RLS
  const { data: openRequestsRows, error: openRequestsError } = await supabase
    .from("freight_requests")
    .select(
      "id, origin_city, origin_state, destination_city, destination_state, cargo_type, pickup_date, created_at, status, selected_quote_id"
    )
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  const openRequests = (openRequestsRows ?? []) as OpenRequest[];

  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const carrierId = carrier?.id ?? null;

  const { data: myQuotesRows } = carrierId
    ? await supabase
        .from("freight_quotes")
        .select("id, freight_request_id, price_cents, deadline_days, status, created_at")
        .eq("carrier_id", carrierId)
    : { data: null };

  const myQuotes = (myQuotesRows ?? []) as MyQuote[];
  const myQuoteByRequestId = new Map(myQuotes.map((q) => [q.freight_request_id, q]));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitações abertas"
        subtitle="Abra uma solicitação para enviar 1 proposta."
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}

      {successText ? <Feedback variant="success" title={successText} /> : null}

      {!carrierId ? (
        <Feedback
          variant="warning"
          title="Seu usuário ainda não está vinculado a uma transportadora"
          description="Crie um registro em carriers com owner_user_id = seu usuário para conseguir enviar propostas."
        />
      ) : null}

      {openRequestsError ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar as solicitações abertas"
          description="Tente recarregar a página."
        />
      ) : null}

      {openRequests.length === 0 && !openRequestsError ? (
        <Feedback
          variant="info"
          title="Não há solicitações abertas no momento"
          description="Volte mais tarde para ver novas oportunidades."
        />
      ) : null}

      <div className="grid gap-3">
        {openRequests.map((r) => {
          const myQuote = myQuoteByRequestId.get(r.id);
          const blocked = !!r.selected_quote_id;

          return (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">
                    {r.origin_city}/{r.origin_state} → {r.destination_city}/{r.destination_state}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>
                      Status: <StatusBadge kind="request" status={r.status} />
                    </span>
                    {r.cargo_type ? <span>• Carga: {r.cargo_type}</span> : null}
                    {r.pickup_date ? (
                      <span>• Coleta: {new Date(r.pickup_date).toLocaleDateString("pt-BR")}</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {myQuote ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="font-medium text-slate-900">Sua proposta (enviada)</div>
                  <div className="text-slate-700">
                    {formatMoneyBRLFromCents(myQuote.price_cents)} • {myQuote.deadline_days} dias
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>Status:</span>
                    <StatusBadge kind="quote" status={myQuote.status} />
                  </div>
                </div>
              ) : blocked ? (
                <Feedback
                  variant="warning"
                  title="Propostas bloqueadas"
                  description="Esta solicitação já teve uma proposta escolhida."
                />
              ) : (
                <div className="flex items-center justify-end">
                  <Link href={`/carrier/solicitacoes/${r.id}`}>
                    <Button disabled={!carrierId}>Enviar proposta</Button>
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
