import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import type { FreightQuoteStatus } from "@/src/lib/db/types";
import { escolherProposta } from "./actions";

type RequestRow = {
  id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  origin_zip: string | null;
  origin_city: string;
  origin_state: string;
  destination_zip: string | null;
  destination_city: string;
  destination_state: string;
  cargo_type: string | null;
  cargo_description: string | null;
  weight_kg: number | null;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  invoice_value_cents: number | null;
  pickup_date: string | null;
  selected_quote_id: string | null;
  created_at: string;
};

type QuoteRow = {
  id: string;
  freight_request_id: string;
  carrier_id: string;
  price_cents: number;
  deadline_days: number;
  notes: string | null;
  status: FreightQuoteStatus;
  created_at: string;
  carriers: { name: string }[] | null;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "CLIENTE")) {
    redirect("/app");
  }

  const { data: requestRow, error: requestError } = await supabase
    .from("freight_requests")
    .select(
      "id, status, origin_zip, origin_city, origin_state, destination_zip, destination_city, destination_state, cargo_type, cargo_description, weight_kg, length_cm, width_cm, height_cm, invoice_value_cents, pickup_date, selected_quote_id, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (requestError || !requestRow) {
    redirect("/app/solicitacoes?error=" + encodeURIComponent("Solicitação não encontrada."));
  }

  const request = requestRow as RequestRow;

  const { data: quotesRows } = await supabase
    .from("freight_quotes")
    .select(
      "id, freight_request_id, carrier_id, price_cents, deadline_days, notes, status, created_at, carriers(name)"
    )
    .eq("freight_request_id", id)
    .order("price_cents", { ascending: true });

  const quotes = (quotesRows ?? []) as unknown as QuoteRow[];

  const canChoose = request.status === "OPEN" && !request.selected_quote_id;

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
          Detalhe da solicitação
        </h1>
        <p className="text-sm text-slate-600">
          {request.origin_city}/{request.origin_state} → {request.destination_city}/{request.destination_state}
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

      <Card className="space-y-2">
        <div className="text-sm text-slate-700">
          <span className="font-medium">Status:</span> {request.status}
        </div>
        {request.pickup_date ? (
          <div className="text-sm text-slate-700">
            <span className="font-medium">Coleta:</span>{" "}
            {new Date(request.pickup_date).toLocaleDateString("pt-BR")}
          </div>
        ) : null}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">Origem:</span> {request.origin_zip ?? "-"} • {request.origin_city}/{request.origin_state}
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Destino:</span> {request.destination_zip ?? "-"} • {request.destination_city}/{request.destination_state}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="text-sm text-slate-700">
            <span className="font-medium">Tipo de carga:</span> {request.cargo_type ?? "-"}
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">Peso:</span> {request.weight_kg ?? "-"}
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="text-sm text-slate-700">
            <span className="font-medium">C:</span> {request.length_cm ?? "-"}
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">L:</span> {request.width_cm ?? "-"}
          </div>
          <div className="text-sm text-slate-700">
            <span className="font-medium">A:</span> {request.height_cm ?? "-"}
          </div>
        </div>
        {typeof request.invoice_value_cents === "number" ? (
          <div className="text-sm text-slate-700">
            <span className="font-medium">Valor da nota:</span> {money(request.invoice_value_cents)}
          </div>
        ) : null}
        {request.cargo_description ? (
          <div className="text-sm text-slate-700">
            <span className="font-medium">Obs:</span> {request.cargo_description}
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Propostas</h2>

        {quotes.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma proposta ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-slate-500">
                  <th className="py-2 pr-4">Transportadora</th>
                  <th className="py-2 pr-4">Valor</th>
                  <th className="py-2 pr-4">Prazo</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Ação</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const isWinner =
                    request.selected_quote_id === q.id || q.status === "WON";
                  const carrierName = q.carriers?.[0]?.name;
                  return (
                    <tr key={q.id} className="border-b last:border-b-0">
                      <td className="py-2 pr-4">
                        {carrierName ?? q.carrier_id}
                        {isWinner ? (
                          <span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                            Vencedora
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 pr-4">{money(q.price_cents)}</td>
                      <td className="py-2 pr-4">{q.deadline_days} dias</td>
                      <td className="py-2 pr-4">{q.status}</td>
                      <td className="py-2">
                        {canChoose ? (
                          <form action={escolherProposta}>
                            <input type="hidden" name="freight_request_id" value={request.id} />
                            <input type="hidden" name="quote_id" value={q.id} />
                            <Button type="submit">Escolher</Button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-500">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!canChoose ? (
          <p className="text-xs text-slate-500">
            Solicitação fechada ou proposta já escolhida. Novas propostas ficam bloqueadas.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
