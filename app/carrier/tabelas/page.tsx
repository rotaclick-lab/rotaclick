import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Feedback } from "@/components/Feedback";
import { Button } from "@/components/Button";
import { Table, Td, Th, Tr } from "@/components/Table";
import { createFreightRateTable } from "./actions";

type FreightRateTableRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export default async function CarrierTabelasPage() {
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

  const { data: rows, error } = await supabase
    .from("freight_rate_tables")
    .select("id, name, is_active, created_at")
    .order("created_at", { ascending: false });

  const tables = (rows ?? []) as FreightRateTableRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tabelas de frete"
        subtitle="Cadastre suas tarifas para aparecer nas cotações automáticas."
        cta={
          <form action={createFreightRateTable}>
            <Button type="submit">Nova tabela</Button>
          </form>
        }
      />

      {errorText ? <Feedback variant="error" title={errorText} /> : null}
      {successText ? <Feedback variant="success" title={successText} /> : null}

      {error ? (
        <Feedback
          variant="error"
          title="Não foi possível carregar suas tabelas"
          description="Tente recarregar a página."
        />
      ) : null}

      {tables.length === 0 && !error ? (
        <Feedback
          variant="info"
          title="Você ainda não tem nenhuma tabela"
          description="Clique em “Nova tabela” para começar."
        />
      ) : null}

      {tables.length > 0 ? (
        <Table>
          <thead>
            <Tr>
              <Th>Nome</Th>
              <Th>Ativa</Th>
              <Th>Criada em</Th>
              <Th className="text-right">Ação</Th>
            </Tr>
          </thead>
          <tbody>
            {tables.map((t) => (
              <Tr key={t.id}>
                <Td className="font-medium text-slate-900">{t.name}</Td>
                <Td>{t.is_active ? "Sim" : "Não"}</Td>
                <Td>{new Date(t.created_at).toLocaleDateString("pt-BR")}</Td>
                <Td className="text-right">
                  <Link href={`/carrier/tabelas/${t.id}`}>
                    <Button variant="secondary">Editar</Button>
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
