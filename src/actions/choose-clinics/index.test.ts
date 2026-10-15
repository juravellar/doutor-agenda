import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  return {
    getSession: vi.fn(),
    findUser: vi.fn(),
    set: vi.fn(() => ({ where })),
    execute: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const tx = {
    query: { usersTable: { findFirst: mocks.findUser } },
    update: () => ({ set: mocks.set }),
    execute: mocks.execute,
  };
  return {
    db: { transaction: async (fn: (tx: unknown) => unknown) => fn(tx) },
  };
});

import { chooseClinics } from ".";

const CENTRO = "11111111-1111-4111-8111-111111111111";
const NORTE = "22222222-2222-4222-8222-222222222222";
const SUL = "33333333-3333-4333-8333-333333333333";
const OTHER = "99999999-9999-4999-8999-999999999999";

const session = (overrides: Record<string, unknown> = {}) => ({
  user: {
    id: "user_1",
    plan: "essential",
    clinicLimit: 2,
    overClinicLimit: true,
    clinic: { id: CENTRO, writable: true },
    clinics: [{ id: CENTRO }, { id: NORTE }, { id: SUL }],
    ...overrides,
  },
});

describe("chooseClinics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-20T12:00:00Z"));
    mocks.getSession.mockResolvedValue(session());
    mocks.findUser.mockResolvedValue({
      id: "user_1",
      clinicChoiceMadeAt: null,
      clinicChoiceChangedAt: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("records the first choice", async () => {
    const result = await chooseClinics({ clinicIds: [CENTRO, SUL] });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith({ keptInPlan: true });
    expect(mocks.set).toHaveBeenCalledWith({ keptInPlan: false });
    expect(mocks.set).toHaveBeenCalledWith({
      clinicChoiceMadeAt: new Date("2026-11-20T12:00:00Z"),
    });
  });

  it("allows one correction, recorded as a change", async () => {
    mocks.findUser.mockResolvedValue({
      id: "user_1",
      clinicChoiceMadeAt: new Date("2026-11-20T11:00:00Z"),
      clinicChoiceChangedAt: null,
    });

    const result = await chooseClinics({ clinicIds: [CENTRO, NORTE] });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith({
      clinicChoiceChangedAt: new Date("2026-11-20T12:00:00Z"),
    });
  });

  it("refuses another change within 30 days and points to support", async () => {
    mocks.findUser.mockResolvedValue({
      id: "user_1",
      clinicChoiceMadeAt: new Date("2026-11-01T00:00:00Z"),
      clinicChoiceChangedAt: new Date("2026-11-10T12:00:00Z"),
    });

    const result = await chooseClinics({ clinicIds: [CENTRO, NORTE] });

    expect(result?.serverError).toContain("10/12/2026");
    expect(result?.serverError).toContain("fale com o suporte");
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("refuses more clinics than the plan allows", async () => {
    const result = await chooseClinics({ clinicIds: [CENTRO, NORTE, SUL] });

    expect(result?.serverError).toBe(
      "Escolha 2 clínicas, o limite do seu plano.",
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("refuses fewer clinics than the plan allows", async () => {
    const result = await chooseClinics({ clinicIds: [SUL] });

    expect(result?.serverError).toBe(
      "Escolha 2 clínicas, o limite do seu plano.",
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("refuses a clinic that isn't the user's", async () => {
    const result = await chooseClinics({ clinicIds: [CENTRO, OTHER] });

    expect(result?.serverError).toBeDefined();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("is not needed when the plan covers every clinic", async () => {
    mocks.getSession.mockResolvedValue(
      session({
        plan: "professional",
        clinicLimit: null,
        overClinicLimit: false,
      }),
    );

    const result = await chooseClinics({ clinicIds: [CENTRO] });

    expect(result?.serverError).toBe(
      "Seu plano já permite usar todas as suas clínicas.",
    );
  });
});
