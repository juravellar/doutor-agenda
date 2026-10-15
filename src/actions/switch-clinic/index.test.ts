import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  return { getSession: vi.fn(), set: vi.fn(() => ({ where })), where };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({ db: { update: () => ({ set: mocks.set }) } }));

import { switchClinic } from ".";

const CENTRO = "11111111-1111-4111-8111-111111111111";
const NORTE = "22222222-2222-4222-8222-222222222222";
const OTHER = "99999999-9999-4999-8999-999999999999";

describe("switchClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({
      user: {
        id: "user_1",
        clinic: { id: CENTRO, writable: true },
        clinics: [{ id: CENTRO }, { id: NORTE }],
      },
    });
  });

  it("switches to one of the user's clinics", async () => {
    const result = await switchClinic({ clinicId: NORTE });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith({ activeClinicId: NORTE });
  });

  it("refuses a clinic that isn't the user's", async () => {
    const result = await switchClinic({ clinicId: OTHER });

    expect(result?.serverError).toBeDefined();
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
