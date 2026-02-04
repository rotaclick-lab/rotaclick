export type CepAddress = {
  city: string;
  state: string;
};

function normalizeCep(raw: string) {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits;
}

export async function resolveCep(cep: string): Promise<CepAddress> {
  const normalized = normalizeCep(cep);

  if (normalized.length !== 8) {
    throw new Error("CEP inválido. Informe um CEP com 8 dígitos.");
  }

  const url = `https://viacep.com.br/ws/${normalized}/json/`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new Error("Não foi possível consultar o CEP no momento. Tente novamente.");
  }

  if (!res.ok) {
    throw new Error("Não foi possível consultar o CEP no momento. Tente novamente.");
  }

  const data = (await res.json()) as {
    erro?: boolean;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) {
    throw new Error("CEP não encontrado. Verifique e tente novamente.");
  }

  const city = (data.localidade ?? "").trim();
  const state = (data.uf ?? "").trim().toUpperCase();

  if (!city || !/^[A-Z]{2}$/.test(state)) {
    throw new Error("CEP inválido. Verifique e tente novamente.");
  }

  return { city, state };
}
