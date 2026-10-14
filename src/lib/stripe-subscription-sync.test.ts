import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  return { findUser: vi.fn(), retrieve: vi.fn(), set, where };
});

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/db", () => ({
  db: {
    query: { usersTable: { findFirst: mocks.findUser } },
    update: () => ({ set: mocks.set }),
  },
}));

import { syncSubscription } from "./stripe-subscription-sync";

const stripe = {
  subscriptions: { retrieve: mocks.retrieve },
} as unknown as Stripe;

const subscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub_current",
  status: "active",
  customer: "cus_1",
  metadata: { userId: "user_1" },
  items: { data: [{ price: { id: "price_professional" } }] },
  ...overrides,
});

const user = (overrides: Record<string, unknown> = {}) => ({
  id: "user_1",
  plan: "professional",
  stripeSubscriptionId: "sub_current",
  stripeCustomerId: "cus_1",
  ...overrides,
});

describe("syncSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_ESSENTIAL_PLAN_PRICE_ID", "price_essential");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "price_professional");
    mocks.findUser.mockResolvedValue(user());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the subscription's current price, not the event's invoice lines", async () => {
    mocks.retrieve.mockResolvedValue(subscription());

    await syncSubscription(stripe, "sub_current");

    expect(mocks.set).toHaveBeenCalledWith({
      plan: "professional",
      stripeSubscriptionId: "sub_current",
      stripeCustomerId: "cus_1",
    });
  });

  it("keeps the plan while a cancellation is scheduled for the period end", async () => {
    mocks.retrieve.mockResolvedValue(
      subscription({ cancel_at_period_end: true }),
    );

    await syncSubscription(stripe, "sub_current");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "professional" }),
    );
  });

  it("does not give the plan back when a stale event arrives after deletion", async () => {
    // The retried event says "active", but Stripe now reports it canceled.
    mocks.retrieve.mockResolvedValue(subscription({ status: "canceled" }));

    await syncSubscription(stripe, "sub_current");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: null, stripeSubscriptionId: null }),
    );
  });

  it("ignores the end of an old subscription when the user has a newer one", async () => {
    mocks.findUser.mockResolvedValue(user({ stripeSubscriptionId: "sub_new" }));
    mocks.retrieve.mockResolvedValue(
      subscription({ id: "sub_old", status: "canceled" }),
    );

    await syncSubscription(stripe, "sub_old");

    expect(mocks.set).not.toHaveBeenCalled();
  });

  it.each(["unpaid", "paused", "incomplete_expired", "incomplete"])(
    "removes the plan when the subscription is %s",
    async (status) => {
      mocks.retrieve.mockResolvedValue(subscription({ status }));

      await syncSubscription(stripe, "sub_current");

      expect(mocks.set).toHaveBeenCalledWith(
        expect.objectContaining({ plan: null }),
      );
    },
  );

  it("keeps the plan while Stripe retries a failed payment (past_due)", async () => {
    mocks.retrieve.mockResolvedValue(subscription({ status: "past_due" }));

    await syncSubscription(stripe, "sub_current");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "professional" }),
    );
  });

  it("adopts a first subscription for a Free user", async () => {
    mocks.findUser.mockResolvedValue(
      user({ plan: null, stripeSubscriptionId: null, stripeCustomerId: null }),
    );
    mocks.retrieve.mockResolvedValue(
      subscription({ items: { data: [{ price: { id: "price_essential" } }] } }),
    );

    await syncSubscription(stripe, "sub_current");

    expect(mocks.set).toHaveBeenCalledWith({
      plan: "essential",
      stripeSubscriptionId: "sub_current",
      stripeCustomerId: "cus_1",
    });
  });

  it("finds the user by Stripe customer when metadata has no user id", async () => {
    mocks.findUser.mockResolvedValueOnce(user()).mockResolvedValue(undefined);
    mocks.retrieve.mockResolvedValue(subscription({ metadata: {} }));

    await syncSubscription(stripe, "sub_current");

    expect(mocks.findUser).toHaveBeenCalledOnce();
    expect(mocks.set).toHaveBeenCalled();
  });
});
