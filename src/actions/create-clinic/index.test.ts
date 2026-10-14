import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const values = vi.fn();
  return { getSession: vi.fn(), values, returning };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => {
  const tx = { insert: () => ({ values: mocks.values }) };
  return {
    db: {
      transaction: async (fn: (tx: unknown) => unknown) => fn(tx),
    },
  };
});

import { createClinic } from ".";

describe("createClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.returning.mockResolvedValue([{ id: "clinic_1" }]);
    mocks.values.mockImplementation((row: Record<string, unknown>) =>
      "name" in row ? { returning: mocks.returning } : Promise.resolve(),
    );
  });

  it("creates the clinic and the membership in one transaction", async () => {
    await expect(createClinic("Clínica")).rejects.toThrow(
      "redirect:/dashboard",
    );

    expect(mocks.values).toHaveBeenCalledWith({ name: "Clínica" });
    expect(mocks.values).toHaveBeenCalledWith({
      userId: "user_1",
      clinicId: "clinic_1",
    });
  });

  it("does not insert anything when the session already has a clinic", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user_1", clinic: { id: "clinic_1" } },
    });

    await expect(createClinic("Outra")).rejects.toThrow("redirect:/dashboard");
    expect(mocks.values).not.toHaveBeenCalled();
  });

  it("treats a concurrent submit that hit the unique index as done", async () => {
    mocks.values.mockImplementation((row: Record<string, unknown>) =>
      "name" in row
        ? { returning: mocks.returning }
        : Promise.reject(
            Object.assign(new Error("duplicate"), { code: "23505" }),
          ),
    );

    await expect(createClinic("Clínica")).rejects.toThrow(
      "redirect:/dashboard",
    );
  });

  it("surfaces other database errors", async () => {
    mocks.values.mockImplementation(() => {
      throw new Error("connection lost");
    });

    await expect(createClinic("Clínica")).rejects.toThrow("connection lost");
  });
});
