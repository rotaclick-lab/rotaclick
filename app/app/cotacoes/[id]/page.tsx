import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Table, Td, Th, Tr } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";

type Quote = {
  id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  origin_zip: string;
  destination_zip: string;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  cargo_type: string | null;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  created_at: string;
};

type QuoteResult = {
  id: string;
  carrier_id: string;
  price_cents: number;
  deadline_days: number;
  status: "SENT" | "WITHDRAWN" | "WON" | "LOST";
  origin_source: "TABELA" | "API";
  created_at: string;
  // Supabase pode retornar relacionamento como array (mesmo em 1:1)
  carriers?: { name: string }[] | null;
};

function formatMoneyBRLFromCents(cents: number) {
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDeadlineDays(days: number) {
  return `${days}d`;
}

export default async function CotacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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

  const { data: quoteRow, error: quoteErr } = await supabase
    .from("quotes")
    .select(
      "id, status, origin_zip, destination_zip, weight_kg, length_cm, width_cm, height_cm, cargo_type, origin_city, origin_state, destination_city, destination_state, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (quoteErr) {
    redirect(
      "/app/cotacoes?error=" +
        encodeURIComponent("Não foi possível carregar a cotação.")
    );
  }

  if (!quoteRow) {
    redirect(
      "/app/cotacoes?error=" +
        encodeURIComponent("Cotação não encontrada (ou sem acesso).")
    );
  }

  const quote = quoteRow as Quote;

  const { data: resultsRows, error: resultsErr } = await supabase
    .from("quote_results")
    .select(
      "id, carrier_id, price_cents, deadline_days, status, origin_source, created_at, carriers(name)"
    )
    .eq("quote_id", id)
    .order("price_cents", { ascending: true });

  const results = ((resultsRows ?? []) as unknown) as QuoteResult[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Detalhe da cotação"
        subtitle="Veja as opções calculadas para esta rota."
        cta={
          <Link href="/app/cotacoes">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}

      <Card className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-900">
              {quote.origin_city}/{quote.origin_state} → {quote.destination_city}/{quote.destination_state}
            </div>
            <div className="text-xs text-slate-500">
              CEP {quote.origin_zip} → {quote.destination_zip} • Peso {quote.weight_kg} kg
              {quote.cargo_type ? ` • ${quote.cargo_type}` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge kind="request" status={quote.status} />
          </div>
        </div>

        {(quote.length_cm || quote.width_cm || quote.height_cm) ? (
          <div className="text-xs text-slate-500">
            Dimensões: {quote.length_cm ?? "—"} x {quote.width_cm ?? "—"} x {quote.height_cm ?? "—"} cm
          </div>
        ) : null}
      </Card>

      {resultsErr ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar as opções"
          description="Tente recarregar a página."
        />
      ) : null}

      {results.length === 0 && !resultsErr ? (
        <Feedback
          variant="info"
          title="Nenhuma opção encontrada"
          description="Pode ser que ainda não existam tabelas ativas para esta rota/faixa de peso."
        />
      ) : null}

      {results.length > 0 ? (
        <Table>
          <thead>
            <Tr>
              <Th>Transportadora</Th>
              <Th>Origem</Th>
              <Th className="text-right">Valor</Th>
              <Th>Prazo</Th>
              <Th>Status</Th>
            </Tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium text-slate-900">
                  {r.carriers?.[0]?.name ?? "Transportadora"}
                </Td>
                <Td>{r.origin_source === "TABELA" ? "Tabela" : "API"}</Td>
                <Td className="text-right">{formatMoneyBRLFromCents(r.price_cents)}</Td>
                <Td>{formatDeadlineDays(r.deadline_days)}</Td>
                <Td>
                  <StatusBadge kind="quote" status={r.status} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
