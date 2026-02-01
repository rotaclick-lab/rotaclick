"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export type CreateFreightRequestState = {
  error: string | null;
};

function requiredString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function optionalString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : null;
}

function optionalNumber(formData: FormData, key: string) {
  const raw = requiredString(formData, key);
  if (!raw) return null;

  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export async function createFreightRequest(
  formData: FormData
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Configuração do Supabase ausente (.env.local).")
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const origin_city = requiredString(formData, "origin_city");
  const origin_state = requiredString(formData, "origin_state");
  const destination_city = requiredString(formData, "destination_city");
  const destination_state = requiredString(formData, "destination_state");

  if (!origin_city || !origin_state || !destination_city || !destination_state) {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Preencha origem e destino (cidade e UF).")
    );
  }

  const cargo_description = optionalString(formData, "cargo_description");
  const weight_kg = optionalNumber(formData, "weight_kg");
  const volume_m3 = optionalNumber(formData, "volume_m3");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Não foi possível carregar seu perfil.")
    );
  }

  if (profile.role !== "ADMIN" && profile.role !== "CLIENTE") {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Seu perfil não tem permissão para criar solicitações.")
    );
  }

  if (!profile.company_id) {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Seu usuário não está vinculado a uma empresa.")
    );
  }

  const { error: insertError } = await supabase.from("freight_requests").insert({
    company_id: profile.company_id,
    created_by: user.id,
    status: "OPEN",
    origin_city,
    origin_state,
    destination_city,
    destination_state,
    cargo_description,
    weight_kg,
    volume_m3,
  });

  if (insertError) {
    redirect(
      "/app/requests/new?error=" +
        encodeURIComponent("Não foi possível criar a solicitação. Tente novamente.")
    );
  }

  redirect("/app/requests");
}
