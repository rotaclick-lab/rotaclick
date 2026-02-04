"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

function requiredString(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function escolherProposta(formData: FormData): Promise<void> {
  const freight_request_id = requiredString(formData, "freight_request_id");
  const quote_id = requiredString(formData, "quote_id");
  const closing_notes_raw = requiredString(formData, "observacao_fechamento");
  const closing_notes = closing_notes_raw ? closing_notes_raw.slice(0, 280) : null;

  if (!freight_request_id || !quote_id) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Dados inválidos.")
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
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile.role !== "ADMIN" && profile.role !== "CLIENTE")) {
    redirect("/app");
  }

  // Confirma que a request pertence à empresa do usuário
  const { data: requestRow, error: requestError } = await supabase
    .from("freight_requests")
    .select("id, status, selected_quote_id")
    .eq("id", freight_request_id)
    .maybeSingle();

  if (requestError || !requestRow) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Solicitação não encontrada.")
    );
  }

  if (requestRow.status !== "OPEN" || requestRow.selected_quote_id) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Esta solicitação já está fechada.")
    );
  }

  // Carrega a proposta vencedora (snapshot mínimo)
  const { data: winningQuote, error: winningQuoteError } = await supabase
    .from("freight_quotes")
    .select("id, freight_request_id, price_cents, deadline_days")
    .eq("id", quote_id)
    .maybeSingle();

  if (winningQuoteError || !winningQuote) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Proposta não encontrada.")
    );
  }

  if (winningQuote.freight_request_id !== freight_request_id) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Proposta inválida para esta solicitação.")
    );
  }

  // 1) define quote vencedora e fecha a solicitação
  const { error: updateReqErr } = await supabase
    .from("freight_requests")
    .update({
      selected_quote_id: quote_id,
      status: "CLOSED",
      final_price_cents: winningQuote.price_cents,
      final_deadline_days: winningQuote.deadline_days,
      closing_notes,
    })
    .eq("id", freight_request_id);

  if (updateReqErr) {
    redirect(
      `/app/solicitacoes/${freight_request_id}?error=` +
        encodeURIComponent("Não foi possível escolher a proposta.")
    );
  }

  // 2) marca propostas: vencedora WON, demais LOST
  await supabase
    .from("freight_quotes")
    .update({ status: "WON" })
    .eq("id", quote_id);

  await supabase
    .from("freight_quotes")
    .update({ status: "LOST" })
    .eq("freight_request_id", freight_request_id)
    .neq("id", quote_id);

  redirect(`/app/solicitacoes/${freight_request_id}?success=` + encodeURIComponent("Proposta escolhida."));
}
