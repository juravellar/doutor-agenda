import type Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

import { formatPlanPrice } from "./stripe-plan";

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
