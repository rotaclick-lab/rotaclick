import "server-only";

import { createSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { resolveCep } from "@/src/lib/cep";

export type QuoteInput = {
  origin_zip: string;
  destination_zip: string;
  weight_kg: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  cargo_type?: string;
};

export type UserContext = {
  company_id: string;
  user_id: string;
  role: "ADMIN" | "CLIENTE";
};

export type QuoteRow = {
  id: string;
  company_id: string;
  created_by_user_id: string;
  status: "OPEN" | "CLOSED" | "CANCELLED";
  origin_zip: string;
  destination_zip: string;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  cargo_type: string | null;
  origin_city: string;
  origin_state: string;
  destination_city: string;
  destination_state: string;
  created_at: string;
};

export type QuoteResultRow = {
  id: string;
  quote_id: string;
  carrier_id: string;
  origin_source: "TABELA" | "API";
  price_cents: number;
  deadline_days: number;
  status: "SENT" | "WITHDRAWN" | "WON" | "LOST";
  meta: unknown | null;
};

type PickBestRateRowResult = {
  rate_row_id: string;
  preco_cents: number;
  prazo_dias: number;
};

function normalizeZip(raw: string) {
  return (raw ?? "").replace(/\D/g, "");
}

function assertValidInput(input: QuoteInput) {
  const origin_zip = normalizeZip(input.origin_zip);
  const destination_zip = normalizeZip(input.destination_zip);

  if (origin_zip.length !== 8 || destination_zip.length !== 8) {
    throw new Error("CEP inválido. Informe CEP de origem e destino com 8 dígitos.");
  }

  if (!Number.isFinite(input.weight_kg) || input.weight_kg <= 0) {
    throw new Error("Peso inválido. Informe um peso maior que zero.");
  }

  const checkDim = (v: unknown, label: string) => {
    if (v == null) return;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} inválida.`);
  };

  checkDim(input.length_cm, "Comprimento");
  checkDim(input.width_cm, "Largura");
  checkDim(input.height_cm, "Altura");

  return { origin_zip, destination_zip };
}

export async function createQuoteAndResults(input: QuoteInput, user: UserContext) {
  if (user.role !== "ADMIN" && user.role !== "CLIENTE") {
    throw new Error("Acesso negado.");
  }

  const { origin_zip, destination_zip } = assertValidInput(input);

  // 1) Resolve CEP antes de gravar (regra MVP)
  const [origin, destination] = await Promise.all([
    resolveCep(origin_zip),
    resolveCep(destination_zip),
  ]);

  // 2) Cria a quote
  const admin = createSupabaseAdminClient();

  const { data: quote, error: quoteErr } = await admin
    .from("quotes")
    .insert({
      company_id: user.company_id,
      created_by_user_id: user.user_id,
      status: "OPEN",
      origin_zip,
      destination_zip,
      weight_kg: input.weight_kg,
      length_cm: input.length_cm ?? null,
      width_cm: input.width_cm ?? null,
      height_cm: input.height_cm ?? null,
      cargo_type: input.cargo_type ?? null,
      origin_city: origin.city,
      origin_state: origin.state,
      destination_city: destination.city,
      destination_state: destination.state,
    })
    .select(
      "id, company_id, created_by_user_id, status, origin_zip, destination_zip, weight_kg, length_cm, width_cm, height_cm, cargo_type, origin_city, origin_state, destination_city, destination_state, created_at"
    )
    .single();

  if (quoteErr || !quote) {
    throw new Error("Não foi possível criar a cotação. Tente novamente.");
  }

  // 3) Descobre carriers com tabela ativa
  const { data: carrierRows, error: carrierErr } = await admin
    .from("freight_rate_tables")
    .select("carrier_id")
    .eq("is_active", true);

  if (carrierErr) {
    throw new Error("Não foi possível calcular as opções de frete. Tente novamente.");
  }

  const carrierIds = Array.from(new Set((carrierRows ?? []).map((r) => r.carrier_id)));

  // 4) Para cada carrier, pega melhor linha via função SQL e insere quote_results
  const results: QuoteResultRow[] = [];

  for (const carrier_id of carrierIds) {
    const { data: pickRows, error: pickErr } = await admin.rpc("pick_best_rate_row", {
      _carrier_id: carrier_id,
      _uf_origem: origin.state,
      _uf_destino: destination.state,
      _peso_kg: input.weight_kg,
    });

    if (pickErr) {
      // Não falha a cotação inteira; só ignora a transportadora
      continue;
    }

  const pick = (pickRows as unknown as PickBestRateRowResult[] | null)?.[0];
  if (!pick?.rate_row_id) continue;

    const { data: inserted, error: insertErr } = await admin
      .from("quote_results")
      .insert({
        quote_id: quote.id,
        carrier_id,
        origin_source: "TABELA",
        price_cents: pick.preco_cents,
        deadline_days: pick.prazo_dias,
        status: "SENT",
        meta: { rate_row_id: pick.rate_row_id },
      })
      .select(
        "id, quote_id, carrier_id, origin_source, price_cents, deadline_days, status, meta"
      )
      .single();

    // Se bater no unique (já existe), só ignora.
    if (insertErr || !inserted) continue;

    results.push(inserted as QuoteResultRow);
  }

  // 5) Ordena para exibição (menor preço, depois menor prazo)
  results.sort((a, b) => {
    if (a.price_cents !== b.price_cents) return a.price_cents - b.price_cents;
    return a.deadline_days - b.deadline_days;
  });

  return {
    quote: quote as QuoteRow,
    results,
  };
}
