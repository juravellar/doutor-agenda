import { describe, expect, it } from "vitest";

import { ensurePlanAllows, PlanLimitError } from "./plan-limits";
import { isPaidPlan, PLANS, resolvePlan } from "./plans";

describe("resolvePlan", () => {
  it("treats users without a subscription as Free", () => {
    expect(resolvePlan(null).id).toBe("free");
    expect(resolvePlan(undefined).id).toBe("free");
    expect(resolvePlan("unknown").id).toBe("free");
  });

  it("returns the paid plan stored for the user", () => {
    expect(resolvePlan("essential").id).toBe("essential");
    expect(resolvePlan("professional").id).toBe("professional");
    expect(isPaidPlan("essential")).toBe(true);
    expect(isPaidPlan(null)).toBe(false);
  });
});

describe("ensurePlanAllows", () => {
  it("allows usage below the limit", () => {
    expect(() => ensurePlanAllows(PLANS.free, "patients", 19)).not.toThrow();
  });

  it("blocks usage at the limit with a user-facing message", () => {
    expect(() => ensurePlanAllows(PLANS.free, "doctors", 1)).toThrow(
      PlanLimitError,
    );
    expect(() =>
      ensurePlanAllows(PLANS.free, "appointmentsPerMonth", 40),
    ).toThrow("Seu plano permite até 40 agendamentos por mês.");
    expect(() => ensurePlanAllows(PLANS.essential, "doctors", 5)).toThrow(
      "Seu plano permite até 5 médicos.",
    );
  });

  it("never blocks unlimited resources", () => {
    expect(() =>
      ensurePlanAllows(PLANS.professional, "doctors", 10_000),
    ).not.toThrow();
    expect(() =>
      ensurePlanAllows(PLANS.professional, "patients", 10_000),
    ).not.toThrow();
  });

  it("limits patients and monthly appointments on the Essencial plan", () => {
    expect(() =>
      ensurePlanAllows(PLANS.essential, "patients", 99),
    ).not.toThrow();
    expect(() => ensurePlanAllows(PLANS.essential, "patients", 100)).toThrow(
      "Seu plano permite até 100 pacientes.",
    );
    expect(() =>
      ensurePlanAllows(PLANS.essential, "appointmentsPerMonth", 200),
    ).toThrow("Seu plano permite até 200 agendamentos por mês.");
  });
});
