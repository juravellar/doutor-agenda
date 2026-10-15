import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const where = vi.fn();
  return { getSession: vi.fn(), set: vi.fn(() => ({ where })), where };
});

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
vi.mock("@/db", () => ({ db: { update: () => ({ set: mocks.set }) } }));

import { TERMS_VERSION } from "@/lib/terms";

import { acceptTerms } from ".";

describe("acceptTerms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getSession.mockResolvedValue({ user: { id: "user_1" } });
  });

  it("records the current version as accepted", async () => {
    const result = await acceptTerms({ version: TERMS_VERSION });

    expect(result?.serverError).toBeUndefined();
    expect(mocks.set).toHaveBeenCalledWith({
      termsAcceptedAt: expect.any(Date),
      termsVersion: TERMS_VERSION,
    });
  });

  it("refuses an outdated version", async () => {
    const result = await acceptTerms({ version: "2020-01-01" as never });

    expect(result?.validationErrors).toBeDefined();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    mocks.getSession.mockResolvedValue(null);

    const result = await acceptTerms({ version: TERMS_VERSION });

    expect(result?.serverError).toBeDefined();
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
