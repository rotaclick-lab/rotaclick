import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, Td, Th, Tr } from "@/components/Table";
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
  final_price_cents: number | null;
  final_deadline_days: number | null;
  closing_notes: string | null;
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
      "id, status, origin_zip, origin_city, origin_state, destination_zip, destination_city, destination_state, cargo_type, cargo_description, weight_kg, length_cm, width_cm, height_cm, invoice_value_cents, pickup_date, selected_quote_id, final_price_cents, final_deadline_days, closing_notes, created_at"
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
  const isClosed = request.status !== "OPEN" || !!request.selected_quote_id;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detalhe da solicitação"
        subtitle={`${request.origin_city}/${request.origin_state} → ${request.destination_city}/${request.destination_state}`}
      />

      <p className="text-xs text-slate-500">
        Compare as propostas e escolha a vencedora. Isso fecha a solicitação.
      </p>

      {errorText ? (
        <Feedback variant="error" title={errorText} />
      ) : null}

      {successText ? (
        <Feedback
          variant="success"
          title="Proposta escolhida"
          description="Solicitação fechada e novas propostas bloqueadas."
        />
      ) : null}

      <Card className="space-y-2">
        <div className="text-sm text-slate-700">
          <span className="font-medium">Status:</span>{" "}
          <StatusBadge kind="request" status={request.status} />
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

      {isClosed && request.status === "CLOSED" ? (
        <Card className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900">Contratação</h2>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="text-sm text-slate-700">
              <span className="font-medium">Valor final:</span>{" "}
              {typeof request.final_price_cents === "number"
                ? money(request.final_price_cents)
                : "-"}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Prazo final:</span>{" "}
              {typeof request.final_deadline_days === "number"
                ? `${request.final_deadline_days} dias`
                : "-"}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-medium">Vencedora:</span>{" "}
              {(() => {
                const q = quotes.find((x) => x.id === request.selected_quote_id);
                const name = q?.carriers?.[0]?.name;
                return name ?? (request.selected_quote_id ? "Selecionada" : "-");
              })()}
            </div>
          </div>

          {request.closing_notes ? (
            <div className="text-sm text-slate-700">
              <span className="font-medium">Observação:</span> {request.closing_notes}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">Propostas</h2>

        {canChoose ? (
          <Feedback
            variant="warning"
            title="Ao escolher, a solicitação será fechada"
            description="Depois disso, novas propostas serão bloqueadas."
          />
        ) : null}

        {quotes.length === 0 ? (
          <p className="text-sm text-slate-600">
            Ainda não há propostas para esta solicitação.
          </p>
        ) : (
          <Table>
            <thead>
              <Tr>
                <Th>Transportadora</Th>
                <Th className="text-right">Valor</Th>
                <Th>Prazo</Th>
                <Th>Status</Th>
                <Th className="text-right">Ação</Th>
              </Tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const isWinner = request.selected_quote_id === q.id || q.status === "WON";
                const carrierName = q.carriers?.[0]?.name;

                return (
                  <Tr key={q.id} className={isWinner ? "bg-emerald-50/60" : ""}>
                    <Td className="font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{carrierName ?? q.carrier_id}</span>
                        {isWinner ? (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Vencedora
                          </span>
                        ) : null}
                      </div>
                    </Td>

                    <Td className="text-right font-semibold text-slate-900">
                      {money(q.price_cents)}
                    </Td>

                    <Td>{q.deadline_days} dias</Td>

                    <Td>
                      <StatusBadge kind="quote" status={q.status} />
                    </Td>

                    <Td className="text-right">
                      {canChoose ? (
                        <form action={escolherProposta} className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:items-start sm:justify-end">
                          <input type="hidden" name="freight_request_id" value={request.id} />
                          <input type="hidden" name="quote_id" value={q.id} />

                          <label className="sr-only" htmlFor={`obs-${q.id}`}>
                            Observação do fechamento
                          </label>
                          <textarea
                            id={`obs-${q.id}`}
                            name="observacao_fechamento"
                            maxLength={280}
                            rows={2}
                            placeholder="Obs. do fechamento (opcional, até 280 caracteres)"
                            className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-600/30 sm:w-72"
                          />

                          <div className="flex justify-end">
                            <Button type="submit" className="whitespace-nowrap">
                            Escolher
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-500">Ação indisponível</span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}

        {!canChoose ? (
          <p className="text-xs text-slate-500">
            Solicitação fechada. Novas propostas ficam bloqueadas.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
