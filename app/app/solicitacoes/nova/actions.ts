"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function requiredString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : null;
}

function optionalInt(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  if (!raw) return null;
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function optionalMoneyCents(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  if (!raw) return null;
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const val = Number(normalized);
  if (!Number.isFinite(val) || val < 0) return null;
  return Math.round(val * 100);
}

export async function criarSolicitacao(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Configuração do Supabase ausente.")
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Não foi possível carregar seu perfil.")
    );
  }

  if (profile.role !== "ADMIN" && profile.role !== "CLIENTE") {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Sem permissão para criar solicitações.")
    );
  }

  if (!profile.company_id) {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Seu usuário não está vinculado a uma empresa.")
    );
  }

  const origin_zip = requiredString(formData, "origin_zip");
  const origin_city = requiredString(formData, "origin_city");
  const origin_state = requiredString(formData, "origin_state");
  const destination_zip = requiredString(formData, "destination_zip");
  const destination_city = requiredString(formData, "destination_city");
  const destination_state = requiredString(formData, "destination_state");

  const cargo_type = requiredString(formData, "cargo_type");
  const cargo_description = optionalString(formData, "cargo_description");
  const weight_kg = optionalNumber(formData, "weight_kg");
  const length_cm = optionalInt(formData, "length_cm");
  const width_cm = optionalInt(formData, "width_cm");
  const height_cm = optionalInt(formData, "height_cm");
  const invoice_value_cents = optionalMoneyCents(formData, "invoice_value");
  const pickup_date = requiredString(formData, "pickup_date");

  if (
    !origin_zip ||
    !origin_city ||
    !origin_state ||
    !destination_zip ||
    !destination_city ||
    !destination_state ||
    !cargo_type ||
    !pickup_date
  ) {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Preencha origem, destino, tipo de carga e data de coleta.")
    );
  }

  const { error: insertError } = await supabase.from("freight_requests").insert({
    company_id: profile.company_id,
    created_by: user.id,
    status: "OPEN",
    origin_zip,
    origin_city,
    origin_state,
    destination_zip,
    destination_city,
    destination_state,
    cargo_type,
    cargo_description,
    weight_kg,
    length_cm,
    width_cm,
    height_cm,
    invoice_value_cents,
    pickup_date,
  });

  if (insertError) {
    redirect(
      "/app/solicitacoes/nova?error=" +
        encodeURIComponent("Não foi possível criar a solicitação. Tente novamente.")
    );
  }

  redirect("/app/solicitacoes");
}
