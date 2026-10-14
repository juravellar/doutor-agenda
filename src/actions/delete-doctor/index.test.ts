import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findDoctor: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({
  db: {
    query: { doctorsTable: { findFirst: mocks.findDoctor } },
    delete: () => ({ where: mocks.deleteWhere }),
  },
}));

import { deleteDoctor } from ".";

const CLINIC_ID = "11111111-1111-4111-8111-111111111111";
const DOCTOR_ID = "22222222-2222-4222-8222-222222222222";

describe("deleteDoctor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findDoctor.mockResolvedValue({ id: DOCTOR_ID, clinicId: CLINIC_ID });
  });

  it("deletes a doctor during the free period", async () => {
    mocks.getSession.mockResolvedValue({
      user: { plan: null, clinic: { id: CLINIC_ID, createdAt: new Date() } },
    });

    const result = await deleteDoctor({ id: DOCTOR_ID });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.deleteWhere).toHaveBeenCalledOnce();
  });

  it("refuses to delete once the free period is over", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        plan: null,
        clinic: { id: CLINIC_ID, createdAt: new Date("2020-01-01T00:00:00Z") },
      },
    });
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-06-01T00:00:00Z"));

    const result = await deleteDoctor({ id: DOCTOR_ID });
    vi.useRealTimers();

    expect(result?.serverError).toContain("período gratuito");
    expect(mocks.deleteWhere).not.toHaveBeenCalled();
  });
});
