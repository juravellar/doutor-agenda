import { describe, expect, it } from "vitest";

import { createGate } from "./create-gate";

const doctor = { one: "médico", many: "médicos" };

describe("createGate", () => {
  it("shows usage and allows creating below the limit", () => {
    expect(createGate({ used: 12, limit: 20 }, false, doctor)).toEqual({
      usageText: "12 de 20 médicos",
      blockedReason: null,
    });
  });

  it("blocks at the limit", () => {
    expect(createGate({ used: 1, limit: 1 }, false, doctor)).toEqual({
      usageText: "1 de 1 médico",
      blockedReason: "Você atingiu o limite do seu plano.",
    });
  });

  it("blocks read-only clinics even below the limit", () => {
    expect(createGate({ used: 0, limit: 1 }, true, doctor).blockedReason).toBe(
      "Seu período gratuito terminou.",
    );
  });

  it("hides usage for unlimited plans", () => {
    expect(createGate({ used: 500, limit: null }, false, doctor)).toEqual({
      usageText: null,
      blockedReason: null,
    });
  });

  it("adds the period to monthly usage", () => {
    expect(
      createGate(
        { used: 38, limit: 40 },
        false,
        { one: "agendamento", many: "agendamentos" },
        " neste mês",
      ).usageText,
    ).toBe("38 de 40 agendamentos neste mês");
  });
});
