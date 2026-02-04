import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { StatusBadge } from "@/components/StatusBadge";
import { Table, Td, Th, Tr } from "@/components/Table";

type RequestListRow = {
  id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  origin_zip: string | null;
  origin_city: string;
  origin_state: string;
  destination_zip: string | null;
  destination_city: string;
  destination_state: string;
  pickup_date: string | null;
  final_price_cents: number | null;
  final_deadline_days: number | null;
  created_at: string;
};

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function SolicitacoesPage() {
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
    .from("freight_requests")
    .select(
      "id, status, origin_zip, origin_city, origin_state, destination_zip, destination_city, destination_state, cargo_type, cargo_description, weight_kg, length_cm, width_cm, height_cm, invoice_value_cents, pickup_date, selected_quote_id, final_price_cents, final_deadline_days, created_at"
    )
    .order("created_at", { ascending: false });

  const requests = (rows ?? []) as unknown as RequestListRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Solicitações"
        subtitle="Crie uma solicitação para receber propostas das transportadoras."
        cta={
          <Link href="/app/solicitacoes/nova">
            <Button>Nova solicitação</Button>
          </Link>
        }
      />

      {error ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar as solicitações."
          description="Tente recarregar a página. Se o problema persistir, fale com o suporte."
        />
      ) : null}

      {requests.length === 0 && !error ? (
        <Feedback
          variant="info"
          title="Nenhuma solicitação ainda"
          description="Crie sua primeira solicitação para começar a receber propostas."
        />
      ) : null}

      {requests.length > 0 ? (
        <Table>
          <thead>
            <Tr>
              <Th>Rota</Th>
              <Th>Status</Th>
              <Th>Coleta</Th>
              <Th className="text-right">Valor final</Th>
              <Th className="text-right">Prazo final</Th>
              <Th className="text-right">Criada em</Th>
            </Tr>
          </thead>
          <tbody>
            {requests.map((r) => {
              const isClosed = r.status === "CLOSED";
              return (
                <Tr key={r.id}>
                  <Td className="font-medium text-slate-900">
                    <Link
                      href={`/app/solicitacoes/${r.id}`}
                      className="block rounded-md focus:outline-none focus:ring-2 focus:ring-sky-600/30"
                    >
                      {r.origin_city}/{r.origin_state} → {r.destination_city}/{r.destination_state}
                      <div className="mt-0.5 text-xs font-normal text-slate-500">
                        {r.origin_zip ?? "-"} • {r.destination_zip ?? "-"}
                      </div>
                    </Link>
                  </Td>

                  <Td>
                    <StatusBadge kind="request" status={r.status} />
                  </Td>

                  <Td className="text-slate-600">
                    {r.pickup_date ? new Date(r.pickup_date).toLocaleDateString("pt-BR") : "—"}
                  </Td>

                  <Td className="text-right font-semibold text-slate-900">
                    {isClosed && typeof r.final_price_cents === "number"
                      ? money(r.final_price_cents)
                      : "—"}
                  </Td>

                  <Td className="text-right text-slate-700">
                    {isClosed && typeof r.final_deadline_days === "number"
                      ? `${r.final_deadline_days}d`
                      : "—"}
                  </Td>

                  <Td className="text-right text-slate-600">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      ) : null}
    </div>
  );
}
