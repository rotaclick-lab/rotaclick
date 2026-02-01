import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { enviarPropostaDoDetalhe } from "./actions";

type RequestRow = {
  id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  selected_quote_id: string | null;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  cargo_type: string | null;
  pickup_date: string | null;
  created_at: string;
};

type MyQuoteRow = {
  id: string;
  price_cents: number;
  deadline_days: number;
  notes: string | null;
  status: "SENT" | "WITHDRAWN" | "WON" | "LOST";
  created_at: string;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CarrierSolicitacaoDetalhePage({
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

  if (!profile || profile.role !== "TRANSPORTADOR") {
    redirect("/app");
  }

  // RLS já garante: transportador só consegue ver OPEN (policy) —
  // mas se não achar, mostramos mensagem.
  const { data: requestRow } = await supabase
    .from("freight_requests")
    .select(
      "id, status, selected_quote_id, origin_city, origin_state, destination_city, destination_state, cargo_type, pickup_date, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!requestRow) {
    redirect(
      "/carrier/solicitacoes?error=" +
        encodeURIComponent("Solicitação não encontrada (ou não está aberta).")
    );
  }

  const request = requestRow as RequestRow;

  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const carrierId = carrier?.id ?? null;

  const { data: myQuoteRow } = carrierId
    ? await supabase
        .from("freight_quotes")
        .select("id, price_cents, deadline_days, notes, status, created_at")
        .eq("freight_request_id", id)
        .eq("carrier_id", carrierId)
        .maybeSingle()
    : { data: null };

  const myQuote = (myQuoteRow ?? null) as MyQuoteRow | null;

  const canQuote =
    !!carrierId && request.status === "OPEN" && !request.selected_quote_id && !myQuote;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-brand-secondary">
            Enviar proposta
          </h1>
          <p className="text-sm text-slate-600">
            {request.origin_city}/{request.origin_state} → {request.destination_city}/
            {request.destination_state}
          </p>
          <p className="text-xs text-slate-500">
            Informe valor e prazo. Você pode enviar apenas 1 proposta por solicitação.
          </p>
        </div>

        <Link href="/carrier/solicitacoes">
          <Button variant="secondary">Voltar</Button>
        </Link>
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
        {request.cargo_type ? (
          <div className="text-sm text-slate-700">
            <span className="font-medium">Carga:</span> {request.cargo_type}
          </div>
        ) : null}
      </Card>

      {!carrierId ? (
        <Card>
          <p className="text-sm text-slate-700">
            Seu usuário ainda não está vinculado a uma transportadora. Crie um
            registro em <strong>carriers</strong> com <strong>owner_user_id</strong> = seu
            usuário.
          </p>
        </Card>
      ) : null}

      {myQuote ? (
        <Card className="space-y-2">
          <div className="text-sm font-semibold text-slate-900">Sua proposta</div>
          <div className="text-sm text-slate-700">
            {money(myQuote.price_cents)} • {myQuote.deadline_days} dias
          </div>
          <div className="text-xs text-slate-500">Status: {myQuote.status}</div>
          {myQuote.notes ? (
            <div className="text-sm text-slate-700">
              <span className="font-medium">Obs:</span> {myQuote.notes}
            </div>
          ) : null}
        </Card>
      ) : null}

      {canQuote ? (
        <Card>
          <form action={enviarPropostaDoDetalhe} className="space-y-4">
            <input type="hidden" name="freight_request_id" value={request.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="price">
                  Valor (R$) <span className="text-red-600">*</span>
                </label>
                <Input id="price" name="price" inputMode="decimal" placeholder="2500,00" />
              </div>
              <div className="space-y-1">
                <label
                  className="text-sm font-medium text-slate-700"
                  htmlFor="deadline_days"
                >
                  Prazo (dias) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="deadline_days"
                  name="deadline_days"
                  inputMode="numeric"
                  placeholder="3"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="notes">
                Observações (opcional)
              </label>
              <Input id="notes" name="notes" placeholder="Ex: coleta amanhã" />
            </div>

            <Button type="submit">Enviar proposta</Button>
          </form>
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-slate-700">
            Você já enviou uma proposta ou a solicitação não está mais aberta.
          </p>
        </Card>
      )}
    </div>
  );
}
