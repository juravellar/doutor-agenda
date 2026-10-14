import type Stripe from "stripe";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  return {
    findUser: vi.fn(),
    retrieve: vi.fn(),
    list: vi.fn(),
    set,
  };
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
  subscriptions: { retrieve: mocks.retrieve, list: mocks.list },
} as unknown as Stripe;

const subscription = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  status: "active",
  created: 1,
  customer: "cus_1",
  metadata: { userId: "user_1" },
  items: { data: [{ price: { id: "price_professional" } }] },
  ...overrides,
});

const user = (overrides: Record<string, unknown> = {}) => ({
  id: "user_1",
  plan: "professional",
  stripeSubscriptionId: "sub_a",
  stripeCustomerId: "cus_1",
  ...overrides,
});

// The event names one subscription; Stripe reports all of the customer's.
const stripeHas = (
  eventSubscription: ReturnType<typeof subscription>,
  customerSubscriptions: ReturnType<typeof subscription>[],
) => {
  mocks.retrieve.mockImplementation(async (id: string) => {
    const found = [eventSubscription, ...customerSubscriptions].find(
      (candidate) => candidate.id === id,
    );
    if (!found) {
      throw new Error("No such subscription");
    }
    return found;
  });
  mocks.list.mockResolvedValue({ data: customerSubscriptions });
};

describe("syncSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_ESSENTIAL_PLAN_PRICE_ID", "price_essential");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "price_professional");
    mocks.findUser.mockResolvedValue(user());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("uses the subscription's current price, not an invoice line", async () => {
    const a = subscription("sub_a");
    stripeHas(a, [a]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith({
      plan: "professional",
      stripeSubscriptionId: "sub_a",
      stripeCustomerId: "cus_1",
    });
  });

  it("keeps the plan while a cancellation is scheduled for the period end", async () => {
    const a = subscription("sub_a", { cancel_at_period_end: true });
    stripeHas(a, [a]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "professional" }),
    );
  });

  it("does not give the plan back when a stale event arrives after deletion", async () => {
    const a = subscription("sub_a", { status: "canceled" });
    stripeHas(a, [a]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: null, stripeSubscriptionId: null }),
    );
  });

  it("keeps the newer subscription when an old one ends", async () => {
    mocks.findUser.mockResolvedValue(user({ stripeSubscriptionId: "sub_b" }));
    const oldOne = subscription("sub_a", { status: "canceled" });
    const newOne = subscription("sub_b", { created: 2 });
    stripeHas(oldOne, [oldOne, newOne]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "professional",
        stripeSubscriptionId: "sub_b",
      }),
    );
  });

  it("does not let an active duplicate take over the current subscription", async () => {
    const current = subscription("sub_a");
    const duplicate = subscription("sub_b", {
      created: 2,
      items: { data: [{ price: { id: "price_essential" } }] },
    });
    stripeHas(duplicate, [current, duplicate]);

    await syncSubscription(stripe, "sub_b");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "professional",
        stripeSubscriptionId: "sub_a",
      }),
    );
  });

  it("keeps access through another subscription when the current one ends", async () => {
    const current = subscription("sub_a", { status: "canceled" });
    const other = subscription("sub_b", {
      created: 2,
      items: { data: [{ price: { id: "price_essential" } }] },
    });
    stripeHas(current, [current, other]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: "essential",
        stripeSubscriptionId: "sub_b",
      }),
    );
  });

  it("checks a current subscription that belongs to another customer", async () => {
    const elsewhere = subscription("sub_a", { customer: "cus_old" });
    const ended = subscription("sub_b", { status: "canceled" });
    stripeHas(ended, [ended]);
    mocks.retrieve.mockImplementation(async (id: string) =>
      id === "sub_a" ? elsewhere : ended,
    );

    await syncSubscription(stripe, "sub_b");

    expect(mocks.set).toHaveBeenCalledWith({
      plan: "professional",
      stripeSubscriptionId: "sub_a",
      stripeCustomerId: "cus_old",
    });
  });

  it.each(["unpaid", "paused", "incomplete_expired", "incomplete"])(
    "removes the plan when the only subscription is %s",
    async (status) => {
      const a = subscription("sub_a", { status });
      stripeHas(a, [a]);

      await syncSubscription(stripe, "sub_a");

      expect(mocks.set).toHaveBeenCalledWith(
        expect.objectContaining({ plan: null }),
      );
    },
  );

  it("keeps the plan while Stripe retries a failed payment (past_due)", async () => {
    const a = subscription("sub_a", { status: "past_due" });
    stripeHas(a, [a]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "professional" }),
    );
  });

  it("adopts a first subscription for a Free user", async () => {
    mocks.findUser.mockResolvedValue(
      user({ plan: null, stripeSubscriptionId: null }),
    );
    const a = subscription("sub_a", {
      items: { data: [{ price: { id: "price_essential" } }] },
    });
    stripeHas(a, [a]);

    await syncSubscription(stripe, "sub_a");

    expect(mocks.set).toHaveBeenCalledWith({
      plan: "essential",
      stripeSubscriptionId: "sub_a",
      stripeCustomerId: "cus_1",
    });
  });

  it("ignores subscriptions that belong to no user of the app", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    mocks.findUser.mockResolvedValue(undefined);
    const foreign = subscription("sub_x", { metadata: {} });
    stripeHas(foreign, [foreign]);

    await expect(syncSubscription(stripe, "sub_x")).resolves.toBeUndefined();

    expect(mocks.set).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
  });
});
