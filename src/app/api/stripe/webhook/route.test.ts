import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  return {
    constructEvent: vi.fn(),
    findUser: vi.fn(),
    set,
    where,
  };
});

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("stripe", () => ({
  default: class {
    webhooks = { constructEvent: mocks.constructEvent };
  },
}));
vi.mock("@/db", () => ({
  db: {
    query: { usersTable: { findFirst: mocks.findUser } },
    update: () => ({ set: mocks.set }),
  },
}));

import { POST } from "./route";

const USER_ID = "user_1";

const subscriptionEvent = (
  type: string,
  subscription: Record<string, unknown>,
) => ({
  type,
  data: {
    object: {
      id: "sub_1",
      customer: "cus_1",
      metadata: { userId: USER_ID },
      items: { data: [{ price: { id: "price_professional" } }] },
      ...subscription,
    },
  },
});

const sendEvent = async (event: unknown) => {
  mocks.constructEvent.mockReturnValue(event);
  return POST(
    new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }),
  );
};

describe("Stripe webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_ESSENTIAL_PLAN_PRICE_ID", "price_essential");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "price_professional");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("keeps the plan when cancellation is scheduled for the period end", async () => {
    const response = await sendEvent(
      subscriptionEvent("customer.subscription.updated", {
        status: "active",
        cancel_at_period_end: true,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ plan: null }),
    );
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "professional" }),
    );
  });

  it("removes the plan when the subscription is canceled", async () => {
    await sendEvent(
      subscriptionEvent("customer.subscription.updated", {
        status: "canceled",
        cancel_at_period_end: false,
      }),
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: null }),
    );
  });

  it("removes the plan when the period of a canceled subscription ends", async () => {
    await sendEvent(
      subscriptionEvent("customer.subscription.deleted", {
        status: "canceled",
      }),
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: null }),
    );
  });

  it("switches the plan after a change in the customer portal", async () => {
    await sendEvent(
      subscriptionEvent("customer.subscription.updated", {
        status: "active",
        cancel_at_period_end: false,
        items: { data: [{ price: { id: "price_essential" } }] },
      }),
    );

    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "essential" }),
    );
  });

  it("rejects requests with an invalid signature", async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const response = await POST(
      new Request("http://localhost/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig" },
        body: "{}",
      }),
    );

    expect(response.status).toBe(400);
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
