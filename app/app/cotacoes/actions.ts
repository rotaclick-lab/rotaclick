"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function requiredString(formData: FormData, name: string) {
  const v = formData.get(name);
  if (typeof v !== "string") return "";
  return v.trim();
}

function optionalNumber(formData: FormData, name: string) {
  const v = formData.get(name);
  if (typeof v !== "string") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createQuoteFromForm(formData: FormData): Promise<void> {
  const origin_zip = requiredString(formData, "origin_zip");
  const destination_zip = requiredString(formData, "destination_zip");
  const weight_kg = optionalNumber(formData, "weight_kg");

  if (!origin_zip || !destination_zip || !weight_kg || weight_kg <= 0) {
    redirect(
      "/app/cotacoes/nova?error=" +
        encodeURIComponent("Informe CEP origem, CEP destino e peso (kg).")
    );
  }

  const length_cm = optionalNumber(formData, "length_cm");
  const width_cm = optionalNumber(formData, "width_cm");
  const height_cm = optionalNumber(formData, "height_cm");
  const cargo_type = requiredString(formData, "cargo_type") || undefined;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let res: Response;
  try {
    // Mesmo host (Next route handler). Cookies do SSR serão enviados.
    res = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        origin_zip,
        destination_zip,
        weight_kg,
        length_cm: length_cm ?? undefined,
        width_cm: width_cm ?? undefined,
        height_cm: height_cm ?? undefined,
        cargo_type,
      }),
      cache: "no-store",
    });
  } catch {
    redirect(
      "/app/cotacoes/nova?error=" +
        encodeURIComponent("Não foi possível enviar a solicitação. Tente novamente.")
    );
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: unknown }).error)
        : "Não foi possível criar a cotação.";

    redirect(
      "/app/cotacoes/nova?error=" +
        encodeURIComponent(message || "Não foi possível criar a cotação.")
    );
  }

  // Esperado: { quote: { id: ... }, results: [...] }
  const quoteId = (() => {
    if (!payload || typeof payload !== "object") return "";
    if (!("quote" in payload)) return "";
    const quote = (payload as { quote?: unknown }).quote;
    if (!quote || typeof quote !== "object") return "";
    const id = (quote as { id?: unknown }).id;
    return typeof id === "string" ? id : "";
  })();

  if (!quoteId) {
    redirect(
      "/app/cotacoes/nova?error=" +
        encodeURIComponent("Cotação criada, mas não consegui ler o ID de retorno.")
    );
  }

  redirect("/app/cotacoes/" + quoteId);
}
