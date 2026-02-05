"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function requiredString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.trim();
}

export async function createFreightRateTable(): Promise<void> {
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

  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!carrier) {
    redirect(
      "/carrier/tabelas?error=" +
        encodeURIComponent(
          "Seu usuário não está vinculado a uma transportadora (carriers.owner_user_id)."
        )
    );
  }

  const { data: inserted, error } = await supabase
    .from("freight_rate_tables")
    .insert({ carrier_id: carrier.id, name: "Tabela padrão", is_active: true })
    .select("id")
    .single();

  if (error || !inserted) {
    redirect(
      "/carrier/tabelas?error=" +
        encodeURIComponent("Não foi possível criar a tabela. Tente novamente.")
    );
  }

  redirect("/carrier/tabelas/" + inserted.id);
}

export async function updateFreightRateTable(formData: FormData): Promise<void> {
  const tableId = requiredString(formData, "table_id");
  const name = requiredString(formData, "name");

  if (!tableId || !name) {
    redirect(
      `/carrier/tabelas/${encodeURIComponent(tableId || "")}?error=` +
        encodeURIComponent("Preencha o nome da tabela.")
    );
  }

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

  const { error } = await supabase
    .from("freight_rate_tables")
    .update({ name })
    .eq("id", tableId);

  if (error) {
    redirect(
      `/carrier/tabelas/${tableId}?error=` +
        encodeURIComponent("Não foi possível salvar. Tente novamente.")
    );
  }

  redirect(
    `/carrier/tabelas/${tableId}?success=` +
      encodeURIComponent("Tabela atualizada.")
  );
}

export async function toggleFreightRateTableActive(formData: FormData): Promise<void> {
  const tableId = requiredString(formData, "table_id");
  const isActiveRaw = requiredString(formData, "is_active");
  const is_active = isActiveRaw === "on" || isActiveRaw === "true";

  if (!tableId) redirect("/carrier/tabelas");

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

  const { error } = await supabase
    .from("freight_rate_tables")
    .update({ is_active })
    .eq("id", tableId);

  if (error) {
    redirect(
      `/carrier/tabelas/${tableId}?error=` +
        encodeURIComponent("Não foi possível atualizar o status. Tente novamente.")
    );
  }

  redirect(
    `/carrier/tabelas/${tableId}?success=` +
      encodeURIComponent("Status atualizado.")
  );
}

function parseUf(v: string) {
  const uf = (v || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return null;
  return uf;
}

function parseNumberLikeBR(v: string) {
  // aceita "10", "10.5", "10,5"
  const normalized = (v || "").trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n;
}

function parseIntStrict(v: string) {
  const n = Number(String(v).trim());
  if (!Number.isInteger(n)) return null;
  return n;
}

export async function addFreightRateTableRow(formData: FormData): Promise<void> {
  const tableId = requiredString(formData, "table_id");

  const uf_origem = parseUf(requiredString(formData, "uf_origem"));
  const uf_destino = parseUf(requiredString(formData, "uf_destino"));

  const peso_min_kg = parseNumberLikeBR(requiredString(formData, "peso_min_kg"));
  const peso_max_kg = parseNumberLikeBR(requiredString(formData, "peso_max_kg"));
  const precoBRL = parseNumberLikeBR(requiredString(formData, "preco"));
  const prazo_dias = parseIntStrict(requiredString(formData, "prazo_dias"));
  const isActiveRaw = requiredString(formData, "is_active");
  const is_active = isActiveRaw === "on" || isActiveRaw === "true";

  if (!tableId) redirect("/carrier/tabelas");

  const hasInvalid =
    !uf_origem ||
    !uf_destino ||
    peso_min_kg === null ||
    peso_max_kg === null ||
    precoBRL === null ||
    !prazo_dias;

  if (hasInvalid) {
    redirect(
      `/carrier/tabelas/${tableId}?error=` +
        encodeURIComponent(
          "Preencha UF (2 letras), pesos, preço e prazo (dias) corretamente."
        )
    );
  }

  const preco_cents = Math.round((precoBRL as number) * 100);

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

  const { error } = await supabase.from("freight_rate_table_rows").insert({
    rate_table_id: tableId,
    uf_origem,
    uf_destino,
    peso_min_kg,
    peso_max_kg,
    preco_cents,
    prazo_dias,
    is_active,
  });

  if (error) {
    redirect(
      `/carrier/tabelas/${tableId}?error=` +
        encodeURIComponent("Não foi possível adicionar a linha. Verifique os valores.")
    );
  }

  redirect(
    `/carrier/tabelas/${tableId}?success=` +
      encodeURIComponent("Linha adicionada.")
  );
}
