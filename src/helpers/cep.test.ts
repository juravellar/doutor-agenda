import { describe, expect, it, vi } from "vitest";

import { fetchAddressByCep } from "./cep";

const json = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("fetchAddressByCep", () => {
  it("maps ViaCEP's answer to the address fields", async () => {
    const fetcher = json({
      logradouro: "Avenida Paulista",
      bairro: "Bela Vista",
      localidade: "São Paulo",
      uf: "SP",
    });

    await expect(fetchAddressByCep("01310-100", fetcher)).resolves.toEqual({
      street: "Avenida Paulista",
      district: "Bela Vista",
      city: "São Paulo",
      state: "SP",
    });
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://viacep.com.br/ws/01310100/json/",
    );
  });

  it("returns null for an unknown CEP, an error or an incomplete one", async () => {
    await expect(fetchAddressByCep("99999-999", json({ erro: true }))).resolves.toBeNull();
    await expect(fetchAddressByCep("01310-100", json({}, 500))).resolves.toBeNull();
    await expect(
      fetchAddressByCep("01310-100", vi.fn().mockRejectedValue(new Error("offline"))),
    ).resolves.toBeNull();
    const fetcher = vi.fn();
    await expect(fetchAddressByCep("0131", fetcher)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
