import { onlyDigits } from "./cpf";

export interface CepAddress {
  street: string;
  district: string;
  city: string;
  state: string;
}

// Looks a CEP up in ViaCEP (public, no key) to fill the address. Any failure
// (unknown CEP, timeout, offline) returns null and the user types it in.
export async function fetchAddressByCep(
  cep: string,
  fetcher: typeof fetch = fetch,
): Promise<CepAddress | null> {
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return null;
  }
  try {
    const response = await fetcher(`https://viacep.com.br/ws/${digits}/json/`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (data.erro) {
      return null;
    }
    return {
      street: data.logradouro ?? "",
      district: data.bairro ?? "",
      city: data.localidade ?? "",
      state: data.uf ?? "",
    };
  } catch {
    return null;
  }
}
