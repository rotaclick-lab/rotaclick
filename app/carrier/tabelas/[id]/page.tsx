import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { Table, Td, Th, Tr } from "@/components/Table";
import {
  addFreightRateTableRow,
  toggleFreightRateTableActive,
  updateFreightRateTable,
} from "../actions";

type RateTable = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

type RateRow = {
  id: string;
  uf_origem: string;
  uf_destino: string;
  peso_min_kg: number;
  peso_max_kg: number;
  preco_cents: number;
  prazo_dias: number;
  is_active: boolean;
  created_at: string;
};

function formatMoneyBRLFromCents(cents: number) {
  const v = cents / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function CarrierTabelaDetalhePage({
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

  const { data: tableRow, error: tableErr } = await supabase
    .from("freight_rate_tables")
    .select("id, name, is_active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (tableErr) {
    redirect(
      "/carrier/tabelas?error=" +
        encodeURIComponent("Não foi possível carregar a tabela.")
    );
  }

  if (!tableRow) {
    redirect(
      "/carrier/tabelas?error=" +
        encodeURIComponent("Tabela não encontrada (ou sem acesso).")
    );
  }

  const table = tableRow as RateTable;

  const { data: rows, error: rowsErr } = await supabase
    .from("freight_rate_table_rows")
    .select(
      "id, uf_origem, uf_destino, peso_min_kg, peso_max_kg, preco_cents, prazo_dias, is_active, created_at"
    )
    .eq("rate_table_id", id)
    .order("created_at", { ascending: false });

  const rateRows = (rows ?? []) as RateRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={table.name}
        subtitle="Gerencie a tabela e adicione linhas por rota (UF) + faixa de peso."
        cta={
          <Link href="/carrier/tabelas">
            <Button variant="secondary">Voltar</Button>
          </Link>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}
      {successText ? <Feedback variant="success" title={successText} /> : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-900">Detalhes</div>

          <form action={updateFreightRateTable} className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input type="hidden" name="table_id" value={table.id} />
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700" htmlFor="name">
                Nome da tabela
              </label>
              <Input id="name" name="name" defaultValue={table.name} />
            </div>
            <div className="flex items-end justify-end">
              <Button type="submit">Salvar</Button>
            </div>
          </form>

          <form action={toggleFreightRateTableActive} className="flex items-center justify-between gap-3">
            <input type="hidden" name="table_id" value={table.id} />
            <div className="space-y-0.5">
              <div className="text-sm font-medium text-slate-700">Ativa</div>
              <div className="text-xs text-slate-500">
                Se estiver inativa, o motor não considera esta tabela.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={table.is_active}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {table.is_active ? "Ativa" : "Inativa"}
              </label>
              <Button type="submit" variant="secondary">
                Atualizar
              </Button>
            </div>
          </form>
        </Card>

        <Card className="space-y-3">
          <div className="text-sm font-semibold text-slate-900">Adicionar linha</div>

          <form action={addFreightRateTableRow} className="space-y-3">
            <input type="hidden" name="table_id" value={table.id} />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="uf_origem">
                  UF origem
                </label>
                <Input id="uf_origem" name="uf_origem" placeholder="SP" maxLength={2} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="uf_destino">
                  UF destino
                </label>
                <Input id="uf_destino" name="uf_destino" placeholder="RJ" maxLength={2} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="peso_min_kg">
                  Peso min (kg)
                </label>
                <Input id="peso_min_kg" name="peso_min_kg" inputMode="decimal" placeholder="0" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="peso_max_kg">
                  Peso max (kg)
                </label>
                <Input id="peso_max_kg" name="peso_max_kg" inputMode="decimal" placeholder="100" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="preco">
                  Preço (R$)
                </label>
                <Input id="preco" name="preco" inputMode="decimal" placeholder="150" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="prazo_dias">
                  Prazo (dias)
                </label>
                <Input id="prazo_dias" name="prazo_dias" inputMode="numeric" placeholder="3" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300"
              />
              Linha ativa
            </label>

            <Button type="submit" className="w-full">
              Adicionar linha
            </Button>
          </form>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">Linhas da tabela</h2>
          <div className="text-xs text-slate-500">
            {rowsErr ? "" : `${rateRows.length} linha(s)`}
          </div>
        </div>

        {rowsErr ? (
          <Feedback
            variant="error"
            title="Não foi possível carregar as linhas"
            description="Tente recarregar a página."
          />
        ) : null}

        {rateRows.length === 0 && !rowsErr ? (
          <Feedback
            variant="info"
            title="Nenhuma linha cadastrada"
            description="Use o formulário ao lado para adicionar a primeira linha."
          />
        ) : null}

        {rateRows.length > 0 ? (
          <Table>
            <thead>
              <Tr>
                <Th>Origem</Th>
                <Th>Destino</Th>
                <Th>Peso</Th>
                <Th className="text-right">Preço</Th>
                <Th>Prazo</Th>
                <Th>Ativa</Th>
                <Th>Criada em</Th>
              </Tr>
            </thead>
            <tbody>
              {rateRows.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium text-slate-900">{r.uf_origem}</Td>
                  <Td className="font-medium text-slate-900">{r.uf_destino}</Td>
                  <Td>
                    {r.peso_min_kg}–{r.peso_max_kg} kg
                  </Td>
                  <Td className="text-right">{formatMoneyBRLFromCents(r.preco_cents)}</Td>
                  <Td>{r.prazo_dias} dias</Td>
                  <Td>{r.is_active ? "Sim" : "Não"}</Td>
                  <Td>{new Date(r.created_at).toLocaleDateString("pt-BR")}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : null}
      </div>
    </div>
  );
}
