import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { Button } from "@/components/Button";
import { Table, Td, Th, Tr } from "@/components/Table";
import { StatusBadge } from "@/components/StatusBadge";

type QuoteRow = {
  id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  origin_zip: string;
  destination_zip: string;
  weight_kg: number;
  created_at: string;
  // snapshot quando CLOSED
  final_price_cents: number | null;
  final_deadline_days: number | null;
};

function formatMoneyBRLFromCents(cents: number) {
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDeadlineDays(days: number) {
  return `${days}d`;
}

export default async function CotacoesPage() {
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

  const { data: rows, error } = await supabase
    .from("quotes")
    .select(
      "id, status, origin_city, origin_state, destination_city, destination_state, origin_zip, destination_zip, weight_kg, created_at, final_price_cents, final_deadline_days"
    )
    .order("created_at", { ascending: false });

  const quotes = (rows ?? []) as QuoteRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cotações"
        subtitle="Histórico de cotações geradas para sua empresa."
        cta={
          <Link href="/app/cotacoes/nova">
            <Button>Nova cotação</Button>
          </Link>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}
      {successText ? <Feedback variant="success" title={successText} /> : null}

      {error ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar as cotações"
          description="Tente recarregar a página."
        />
      ) : null}

      {quotes.length === 0 && !error ? (
        <Feedback
          variant="info"
          title="Você ainda não tem cotações"
          description="Clique em “Nova cotação” para simular um frete."
        />
      ) : null}

      {quotes.length > 0 ? (
        <Table>
          <thead>
            <Tr>
              <Th>Criada em</Th>
              <Th>Rota</Th>
              <Th>Status</Th>
              <Th>Peso</Th>
              <Th className="text-right">Valor final</Th>
              <Th className="text-right">Prazo final</Th>
              <Th className="text-right">Ação</Th>
            </Tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <Tr key={q.id}>
                <Td>{new Date(q.created_at).toLocaleDateString("pt-BR")}</Td>
                <Td className="font-medium text-slate-900">
                  {q.origin_city}/{q.origin_state} → {q.destination_city}/{q.destination_state}
                </Td>
                <Td>
                  <StatusBadge kind="request" status={q.status} />
                </Td>
                <Td>{q.weight_kg} kg</Td>
                <Td className="text-right">
                  {q.status === "CLOSED" && q.final_price_cents ? (
                    formatMoneyBRLFromCents(q.final_price_cents)
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>
                <Td className="text-right">
                  {q.status === "CLOSED" && q.final_deadline_days ? (
                    formatDeadlineDays(q.final_deadline_days)
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </Td>
                <Td className="text-right">
                  <Link href={`/app/cotacoes/${q.id}`}>
                    <Button variant="secondary">Ver</Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
