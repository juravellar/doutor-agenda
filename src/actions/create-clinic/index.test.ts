import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const returning = vi.fn();
  const values = vi.fn(() => ({ returning }));
  return {
    getSession: vi.fn(),
    findMembership: vi.fn(),
    execute: vi.fn(),
    values,
    returning,
  };
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
  const db: Record<string, unknown> = {
    query: { usersToClinicsTable: { findFirst: mocks.findMembership } },
    insert: () => ({ values: mocks.values }),
  };
  db.transaction = async (fn: (tx: unknown) => unknown) =>
    fn({ ...db, execute: mocks.execute });
  return { db };
});

import { createClinic } from ".";

describe("createClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "user_1" } });
    mocks.returning.mockResolvedValue([{ id: "clinic_1" }]);
  });

  it("creates the user's first clinic under the user's lock", async () => {
    mocks.findMembership.mockResolvedValue(undefined);

    await expect(createClinic("Clínica")).rejects.toThrow(
      "redirect:/dashboard",
    );

    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(mocks.values).toHaveBeenCalledWith({ name: "Clínica" });
    expect(mocks.values).toHaveBeenCalledWith({
      userId: "user_1",
      clinicId: "clinic_1",
    });
  });

  it("does not create a second clinic, even if the session still has none", async () => {
    // A concurrent submit already created it after this session was read.
    mocks.findMembership.mockResolvedValue({ clinicId: "clinic_1" });

    await expect(createClinic("Outra clínica")).rejects.toThrow(
      "redirect:/dashboard",
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
