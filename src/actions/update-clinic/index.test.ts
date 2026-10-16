import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  return {
    getSession: vi.fn(),
    set: vi.fn(() => ({ where })),
    where,
    findFirst: vi.fn(),
  };
});

const audit = vi.hoisted(() => ({ recordAudit: vi.fn() }));
vi.mock("@/lib/audit", () => audit);
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const tx = {
    update: () => ({ set: mocks.set }),
    query: { clinicsTable: { findFirst: mocks.findFirst } },
  };
  return {
    db: { transaction: async (fn: (tx: unknown) => unknown) => fn(tx) },
  };
});

import { updateClinic } from ".";

describe("updateClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: {
        id: "user_1",
        plan: "essential",
        freePeriodStartsAt: new Date(),
        clinic: { id: "clinic_1", writable: true },
      },
    });
  });

  it("updates the active clinic's details", async () => {
    const result = await updateClinic({
      name: "Clínica Centro",
      address: "Rua A, 10",
      phoneNumber: "11999999999",
    });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith({
      name: "Clínica Centro",
      address: "Rua A, 10",
      phoneNumber: "11999999999",
    });
  });

  it("stores empty optional fields as null", async () => {
    await updateClinic({ name: "Centro", address: "", phoneNumber: "" });

    expect(mocks.set).toHaveBeenCalledWith({
      name: "Centro",
      address: null,
      phoneNumber: null,
    });
  });

  it("refuses to edit a clinic that is read-only on the plan", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "user_1",
        plan: "essential",
        freePeriodStartsAt: new Date(),
        clinic: { id: "clinic_3", writable: false },
      },
    });

    const result = await updateClinic({ name: "Sul" });

    expect(result?.serverError).toContain("só leitura");
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("keeps accepting an incomplete phone saved before the check existed", async () => {
    mocks.findFirst.mockResolvedValue({ phoneNumber: "1199" });

    const result = await updateClinic({ name: "Centro", phoneNumber: "1199" });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalled();
  });

  it("refuses a new incomplete phone", async () => {
    mocks.findFirst.mockResolvedValue({ phoneNumber: "1199" });

    const result = await updateClinic({ name: "Centro", phoneNumber: "1198" });

    expect(result?.serverError).toBe("Telefone inválido.");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
