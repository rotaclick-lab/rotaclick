import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";

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
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
          Solicitações abertas
        </h1>
        <p className="text-sm text-slate-600">
          Abra uma solicitação para enviar 1 proposta.
        </p>
      </div>

      {errorText ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorText}
        </div>
      ) : null}

      {successText ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successText}
        </div>
      ) : null}

      {!carrierId ? (
        <Card>
          <p className="text-sm text-slate-700">
            Seu usuário ainda não está vinculado a uma transportadora. Crie um
            registro em <strong>carriers</strong> com <strong>owner_user_id</strong> = seu
            usuário.
          </p>
        </Card>
      ) : null}

      {openRequestsError ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Não foi possível carregar as solicitações abertas.
        </div>
      ) : null}

      {openRequests.length === 0 && !openRequestsError ? (
        <Card>
          <p className="text-sm text-slate-700">
            Não há solicitações abertas no momento.
          </p>
        </Card>
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
                  <div className="text-xs text-slate-500">
                    {r.cargo_type ? <>Carga: {r.cargo_type} • </> : null}
                    {r.pickup_date ? <>Coleta: {new Date(r.pickup_date).toLocaleDateString("pt-BR")} • </> : null}
                    Status: {r.status}
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
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Esta solicitação já teve uma proposta escolhida. Novas propostas estão bloqueadas.
                </div>
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
