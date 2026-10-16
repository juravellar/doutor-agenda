import { describe, expect, it } from "vitest";

import { BLOCKED_COPY, createGate } from "./create-gate";

const doctor = { one: "médico", many: "médicos" };

describe("createGate", () => {
  it("shows usage and allows creating below the limit", () => {
    expect(createGate({ used: 12, limit: 20 }, null, doctor)).toEqual({
      usageText: "12 de 20 médicos",
      blockedReason: null,
      blockedKind: null,
    });
  });

  it("blocks at the limit", () => {
    expect(createGate({ used: 1, limit: 1 }, null, doctor)).toEqual({
      usageText: "1 de 1 médico",
      blockedReason: "Você atingiu o limite do seu plano.",
      blockedKind: "limit",
    });
  });

  it("blocks read-only clinics even below the limit", () => {
    expect(
      createGate(
        { used: 0, limit: 1 },
        { kind: "free-period-over", message: "Seu período gratuito terminou." },
        doctor,
      ),
    ).toEqual({
      usageText: "0 de 1 médico",
      blockedReason: "Seu período gratuito terminou.",
      blockedKind: "free-period-over",
    });
  });

  it("takes the kind from the block, not from its wording", () => {
    expect(
      createGate(
        { used: 0, limit: 5 },
        { kind: "read-only", message: "Qualquer texto" },
        doctor,
      ).blockedKind,
    ).toBe("read-only");
  });

  it("sends each kind of block to where it can be solved", () => {
    expect(BLOCKED_COPY["read-only"].href).toBe("/clinicas");
    expect(BLOCKED_COPY["free-period-over"].href).toBe("/assinatura");
    expect(BLOCKED_COPY.limit.href).toBe("/assinatura");
  });

  it("hides usage for unlimited plans", () => {
    expect(createGate({ used: 500, limit: null }, null, doctor)).toEqual({
      usageText: null,
      blockedReason: null,
      blockedKind: null,
    });
  });

  it("adds the period to monthly usage", () => {
    expect(
      createGate(
        { used: 38, limit: 40 },
        null,
        { one: "agendamento", many: "agendamentos" },
        " neste mês",
      ).usageText,
    ).toBe("38 de 40 agendamentos neste mês");
  });
});
