import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const where = vi.fn();
  return {
    getSession: vi.fn(),
    count: vi.fn(),
    values: vi.fn(),
    returning,
    set: vi.fn(() => ({ where })),
    execute: vi.fn(),
  };
});

const audit = vi.hoisted(() => ({ recordAudit: vi.fn() }));
vi.mock("@/lib/audit", () => audit);
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const tx = {
    $count: mocks.count,
    insert: () => ({ values: mocks.values }),
    update: () => ({ set: mocks.set }),
    execute: mocks.execute,
  };
  return {
    db: { transaction: async (fn: (tx: unknown) => unknown) => fn(tx) },
  };
});

import { createClinic } from ".";

describe("createClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user_1", plan: null } });
    mocks.returning.mockResolvedValue([{ id: "clinic_new" }]);
    mocks.values.mockImplementation((row: Record<string, unknown>) =>
      "name" in row ? { returning: mocks.returning } : Promise.resolve(),
    );
    mocks.count.mockResolvedValue(0);
  });

  it("creates the first clinic and makes it active", async () => {
    await expect(createClinic("Centro")).rejects.toThrow("redirect:/painel");

    expect(mocks.values).toHaveBeenCalledWith({ name: "Centro" });
    expect(mocks.values).toHaveBeenCalledWith({
      userId: "user_1",
      clinicId: "clinic_new",
    });
    expect(mocks.set).toHaveBeenCalledWith({
      activeClinicId: "clinic_new",
      clinicChoiceMadeAt: null,
      clinicChoiceChangedAt: null,
    });
  });

  it("clears an earlier choice of active clinics", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user_1", plan: "professional" },
    });
    mocks.count.mockResolvedValue(2);

    await expect(createClinic("Filial")).rejects.toThrow("redirect:/painel");

    expect(mocks.set).toHaveBeenCalledWith({ keptInPlan: false });
  });

  it("refuses a blank or oversized name", async () => {
    await expect(createClinic("   ")).rejects.toThrow();
    await expect(createClinic("x".repeat(121))).rejects.toThrow();
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("refuses a second clinic on the Free plan", async () => {
    mocks.count.mockResolvedValue(1);

    await expect(createClinic("Norte")).resolves.toEqual({
      limitReached: true,
    });
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("allows a second clinic on the Essencial plan, but not a third", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user_1", plan: "essential" },
    });
    mocks.count.mockResolvedValueOnce(1).mockResolvedValueOnce(2);

    await expect(createClinic("Norte")).rejects.toThrow("redirect:/painel");
    await expect(createClinic("Sul")).resolves.toEqual({ limitReached: true });
    expect(mocks.values).toHaveBeenCalledTimes(2);
  });

  it("does not limit clinics on the Profissional plan", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user_1", plan: "professional" },
    });
    mocks.count.mockResolvedValue(25);

    await expect(createClinic("Filial")).rejects.toThrow("redirect:/painel");
  });

  it("counts clinics under the user's lock", async () => {
    await expect(createClinic("Centro")).rejects.toThrow();

    expect(mocks.execute.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.count.mock.invocationCallOrder[0],
    );
  });
});
