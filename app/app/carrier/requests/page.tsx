import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { createQuote } from "./actions/createQuote";

type OpenRequest = {
  id: string;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  cargo_description: string | null;
  created_at: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
};

type MyQuote = {
  id: string;
  freight_request_id: string;
  price_cents: number;
  deadline_days: number;
  status: "SENT" | "WITHDRAWN";
  created_at: string;
};

function formatMoneyBRLFromCents(cents: number) {
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CarrierRequestsPage() {
  const h = await headers();
  const url = new URL(h.get("x-url") ?? "http://localhost");
  const errorText = url.searchParams.get("error");
  const successText = url.searchParams.get("success");

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

  if (!profile || profile.role !== "TRANSPORTADOR") {
    redirect("/app");
  }

  // Transportador vê requests OPEN por RLS
  const { data: openRequestsRows, error: openRequestsError } = await supabase
    .from("freight_requests")
    .select(
      "id, origin_city, origin_state, destination_city, destination_state, cargo_description, created_at, status"
    )
    .eq("status", "OPEN")
    .order("created_at", { ascending: false });

  const openRequests = (openRequestsRows ?? []) as OpenRequest[];

  // Descobre o carrier do usuário e carrega as quotes dele
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
          Envie uma proposta para cada solicitação (no máximo 1 por solicitação).
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
          <p className="text-sm text-slate-700">Não há solicitações abertas agora.</p>
        </Card>
      ) : null}

      <div className="grid gap-3">
        {openRequests.map((r) => {
          const myQuote = myQuoteByRequestId.get(r.id);

          return (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">
                    {r.origin_city}/{r.origin_state} → {r.destination_city}/{r.destination_state}
                  </div>
                  {r.cargo_description ? (
                    <div className="text-xs text-slate-500">{r.cargo_description}</div>
                  ) : null}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {myQuote ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div className="font-medium text-slate-900">Sua proposta</div>
                  <div className="text-slate-700">
                    {formatMoneyBRLFromCents(myQuote.price_cents)} • {myQuote.deadline_days} dias
                  </div>
                  <div className="text-xs text-slate-500">Status: {myQuote.status}</div>
                </div>
              ) : (
                <form action={createQuote} className="grid gap-3 sm:grid-cols-12 sm:items-end">
                  <input type="hidden" name="freight_request_id" value={r.id} />

                  <div className="sm:col-span-4">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`price-${r.id}`}>
                      Valor (R$)
                    </label>
                    <Input id={`price-${r.id}`} name="price" inputMode="decimal" placeholder="2500,00" />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`deadline-${r.id}`}>
                      Prazo (dias)
                    </label>
                    <Input id={`deadline-${r.id}`} name="deadline_days" inputMode="numeric" placeholder="3" />
                  </div>

                  <div className="sm:col-span-5">
                    <label className="text-sm font-medium text-slate-700" htmlFor={`notes-${r.id}`}>
                      Observações (opcional)
                    </label>
                    <Input id={`notes-${r.id}`} name="notes" placeholder="Ex: coleta amanhã" />
                  </div>

                  <div className="sm:col-span-12">
                    <Button type="submit" disabled={!carrierId}>
                      Enviar proposta
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
