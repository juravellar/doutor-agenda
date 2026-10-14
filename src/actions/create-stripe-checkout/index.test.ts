import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  const set = vi.fn(() => ({ where }));
  return {
    getSession: vi.fn(),
    findUser: vi.fn(),
    set,
    createCustomer: vi.fn(),
    listSessions: vi.fn(),
    expireSession: vi.fn(),
    createSession: vi.fn(),
    listSubscriptions: vi.fn(),
    execute: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const db: Record<string, unknown> = {
    query: { usersTable: { findFirst: mocks.findUser } },
    update: () => ({ set: mocks.set }),
  };
  db.transaction = async (fn: (tx: unknown) => unknown) =>
    fn({ ...db, execute: mocks.execute });
  return { db };
});
vi.mock("stripe", () => ({
  default: class {
    customers = { create: mocks.createCustomer };
    subscriptions = { list: mocks.listSubscriptions };
    checkout = {
      sessions: {
        list: mocks.listSessions,
        expire: mocks.expireSession,
        create: mocks.createSession,
      },
    };
  },
}));

import { createStripeCheckout } from ".";

const freeUser = {
  id: "user_1",
  name: "Ana",
  email: "ana@example.com",
  plan: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

describe("createStripeCheckout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_PROFESSIONAL_PLAN_PRICE_ID", "price_professional");
    mocks.getSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.findUser.mockResolvedValue(freeUser);
    mocks.createCustomer.mockResolvedValue({ id: "cus_new" });
    mocks.listSubscriptions.mockResolvedValue({ data: [] });
    mocks.listSessions.mockResolvedValue({ data: [] });
    mocks.createSession.mockResolvedValue({ id: "cs_1" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates one Stripe customer for the user and checks out with it", async () => {
    const result = await createStripeCheckout({ plan: "professional" });

    expect(result?.data).toEqual({ sessionId: "cs_1" });
    expect(mocks.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { userId: "user_1" } }),
      { idempotencyKey: "customer-for-user-user_1" },
    );
    expect(mocks.set).toHaveBeenCalledWith({ stripeCustomerId: "cus_new" });
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_new",
        line_items: [{ price: "price_professional", quantity: 1 }],
      }),
    );
  });

  it("reuses the existing Stripe customer", async () => {
    mocks.findUser.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_old",
    });

    await createStripeCheckout({ plan: "professional" });

    expect(mocks.createCustomer).not.toHaveBeenCalled();
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_old" }),
    );
  });

  it("expires checkouts left open in other tabs", async () => {
    mocks.findUser.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_old",
    });
    mocks.listSessions.mockResolvedValue({
      data: [{ id: "cs_open_1" }, { id: "cs_open_2" }],
    });

    await createStripeCheckout({ plan: "professional" });

    expect(mocks.expireSession).toHaveBeenCalledWith("cs_open_1");
    expect(mocks.expireSession).toHaveBeenCalledWith("cs_open_2");
  });

  it("refuses a second subscription, even before its webhook arrives", async () => {
    mocks.findUser.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_old",
    });
    mocks.listSubscriptions.mockResolvedValue({
      data: [
        {
          id: "sub_1",
          status: "active",
          items: { data: [{ price: { id: "price_professional" } }] },
        },
      ],
    });

    const result = await createStripeCheckout({ plan: "professional" });

    expect(result?.serverError).toBe(
      "Você já tem uma assinatura. Use Gerenciar assinatura para trocar de plano.",
    );
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("allows a new checkout after the previous subscription was canceled", async () => {
    mocks.findUser.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_old",
    });
    mocks.listSubscriptions.mockResolvedValue({
      data: [{ id: "sub_1", status: "canceled", items: { data: [] } }],
    });

    const result = await createStripeCheckout({ plan: "professional" });

    expect(result?.data).toEqual({ sessionId: "cs_1" });
  });

  it("still starts a checkout when an old session can no longer be expired", async () => {
    mocks.findUser.mockResolvedValue({
      ...freeUser,
      stripeCustomerId: "cus_old",
    });
    mocks.listSessions.mockResolvedValue({
      data: [{ id: "cs_paid_meanwhile" }],
    });
    mocks.expireSession.mockRejectedValue(new Error("session is not open"));

    const result = await createStripeCheckout({ plan: "professional" });

    expect(result?.data).toEqual({ sessionId: "cs_1" });
  });

  it("runs under the user's lock", async () => {
    await createStripeCheckout({ plan: "professional" });

    expect(mocks.execute).toHaveBeenCalledTimes(2);
    expect(mocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.createSession.mock.invocationCallOrder[0],
    );
  });

  it("keeps the new customer id even if opening the checkout fails", async () => {
    mocks.createSession.mockRejectedValue(new Error("Stripe is down"));

    const result = await createStripeCheckout({ plan: "professional" });

    expect(result?.serverError).toBeDefined();
    expect(mocks.set).toHaveBeenCalledWith({ stripeCustomerId: "cus_new" });
  });
});
