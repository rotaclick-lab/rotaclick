"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function requiredString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function requiredInt(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function requiredMoneyCents(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  if (!raw) return null;

  // Aceita "1234", "1234.56" ou "1234,56"
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const val = Number(normalized);
  if (!Number.isFinite(val) || val <= 0) return null;

  return Math.round(val * 100);
}

export async function createQuote(formData: FormData): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(
      "/app/carrier/requests?error=" +
        encodeURIComponent("Configuração do Supabase ausente (.env.local).")
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "TRANSPORTADOR") {
    redirect("/app");
  }

  const freight_request_id = requiredString(formData, "freight_request_id");
  const deadline_days = requiredInt(formData, "deadline_days");
  const price_cents = requiredMoneyCents(formData, "price");
  const notes = requiredString(formData, "notes") || null;

  if (!freight_request_id || !deadline_days || !price_cents) {
    redirect(
      "/app/carrier/requests?error=" +
        encodeURIComponent("Preencha valor e prazo (em dias).")
    );
  }

  const { data: carrier } = await supabase
    .from("carriers")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!carrier) {
    redirect(
      "/app/carrier/requests?error=" +
        encodeURIComponent("Seu usuário não está vinculado a uma transportadora.")
    );
  }

  const { error } = await supabase.from("freight_quotes").insert({
    freight_request_id,
    carrier_id: carrier.id,
    price_cents,
    deadline_days,
    notes,
    status: "SENT",
  });

  if (error) {
    // Unique violation (uma proposta por solicitação) ou RLS
    redirect(
      "/app/carrier/requests?error=" +
        encodeURIComponent(
          "Não foi possível enviar a proposta. Verifique se você já enviou uma proposta para esta solicitação."
        )
    );
  }

  redirect("/app/carrier/requests?success=" + encodeURIComponent("Proposta enviada."));
}
