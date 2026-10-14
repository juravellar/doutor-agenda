import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({ db: { insert: mocks.insert } }));

import { createClinic } from ".";

describe("createClinic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not create a second clinic, which would restart the free period", async () => {
    mocks.getSession.mockResolvedValue({
      user: { id: "user_1", clinic: { id: "clinic_1" } },
    });

    await expect(createClinic("Outra clínica")).rejects.toThrow(
      "redirect:/dashboard",
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
