import type Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { formatPlanPrice, planForPriceId, priceIdForPlan } from "./stripe-plan";

const price = (overrides: Partial<Stripe.Price>) =>
  ({
    unit_amount: 5900,
    currency: "brl",
    recurring: { interval: "month" },
    ...overrides,
  }) as Stripe.Price;

describe("formatPlanPrice", () => {
  it("formats a monthly BRL price without cents", () => {
    expect(formatPlanPrice(price({}))).toEqual({
      amount: "R$ 59",
      interval: "mês",
    });
  });

  it("keeps cents when the price has them", () => {
    expect(formatPlanPrice(price({ unit_amount: 7990 }))?.amount).toBe(
      "R$ 79,90",
    );
  });

  it("labels yearly prices", () => {
    expect(
      formatPlanPrice(
        price({ recurring: { interval: "year" } as Stripe.Price.Recurring }),
      )?.interval,
    ).toBe("ano");
  });

  it("returns null for prices without a fixed amount", () => {
    expect(formatPlanPrice(price({ unit_amount: null }))).toBeNull();
  });
});

describe("planForPriceId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("maps each configured Stripe price to its plan", () => {
    vi.stubEnv("STRIPE_ESSENTIAL_PLAN_PRICE_ID", "price_essential");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "price_professional");

    expect(priceIdForPlan("professional")).toBe("price_professional");
    expect(planForPriceId("price_essential")).toBe("essential");
    expect(planForPriceId("price_professional")).toBe("professional");
  });

  it("returns null for unknown or missing prices", () => {
    vi.stubEnv("STRIPE_ESSENTIAL_PLAN_PRICE_ID", "price_essential");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "");

    expect(planForPriceId("price_other")).toBeNull();
    expect(planForPriceId(undefined)).toBeNull();
    expect(planForPriceId("")).toBeNull();
  });
});

describe("getPlanPrices", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("hides prices and warns once when Stripe is not configured", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    const { getPlanPrices } = await import("./stripe-plan");

    await expect(getPlanPrices()).resolves.toEqual({
      essential: null,
      professional: null,
    });
    await getPlanPrices();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      "STRIPE_SECRET_KEY is not set; plan prices are hidden",
    );
  });
});
