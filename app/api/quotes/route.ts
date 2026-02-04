import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/src/lib/supabase/server";
import { createQuoteAndResults } from "@/src/lib/quote-engine";

type Body = {
  origin_zip?: unknown;
  destination_zip?: unknown;
  weight_kg?: unknown;
  length_cm?: unknown;
  width_cm?: unknown;
  height_cm?: unknown;
  cargo_type?: unknown;
};

function asString(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function asNumber(v: unknown) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  // 1) Auth via Supabase SSR (cookie)
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Configuração do Supabase ausente." },
      { status: 500 }
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("company_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (profile.role !== "ADMIN" && profile.role !== "CLIENTE") {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (!profile.company_id) {
    return NextResponse.json({ error: "Empresa não encontrada." }, { status: 400 });
  }

  // 2) Body
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const origin_zip = asString(body.origin_zip);
  const destination_zip = asString(body.destination_zip);
  const weight_kg = asNumber(body.weight_kg);

  if (!origin_zip || !destination_zip || !weight_kg) {
    return NextResponse.json(
      { error: "Informe CEP origem, CEP destino e peso." },
      { status: 400 }
    );
  }

  const length_cm = asNumber(body.length_cm);
  const width_cm = asNumber(body.width_cm);
  const height_cm = asNumber(body.height_cm);
  const cargo_type = asString(body.cargo_type) || undefined;

  // 3) Engine
  try {
    const data = await createQuoteAndResults(
      {
        origin_zip,
        destination_zip,
        weight_kg,
        length_cm: length_cm ?? undefined,
        width_cm: width_cm ?? undefined,
        height_cm: height_cm ?? undefined,
        cargo_type,
      },
      {
        company_id: profile.company_id,
        user_id: user.id,
        role: profile.role,
      }
    );

    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar cotação.";

    // Erros de validação / CEP inválido devem ser 400
    const isBadRequest =
      message.toLowerCase().includes("cep") ||
      message.toLowerCase().includes("peso") ||
      message.toLowerCase().includes("invál") ||
      message.toLowerCase().includes("inval");

    return NextResponse.json(
      { error: message },
      { status: isBadRequest ? 400 : 500 }
    );
  }
}
