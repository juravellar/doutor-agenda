import { describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock("@/db", () => ({
  db: { query: { usersToClinicsTable: { findMany } } },
}));

import { loadSessionMemberships, sessionBranding } from "./session-memberships";

describe("loadSessionMemberships", () => {
  it("never loads the clinics' logos, only the columns the session uses", async () => {
    await loadSessionMemberships("user_1");

    const { with: relations } = findMany.mock.calls[0][0];
    expect(relations.clinic.columns).toEqual({
      id: true,
      name: true,
      createdAt: true,
      logoUpdatedAt: true,
      brandColor: true,
    });
    expect(relations.clinic.columns).not.toHaveProperty("logoDataUrl");
  });
});

describe("sessionBranding", () => {
  const membership = (clinicId: string, hasLogo: boolean) => ({
    clinicId,
    createdAt: new Date(0),
    keptInPlan: false,
    clinic: {
      id: clinicId,
      name: clinicId,
      createdAt: new Date(1_000),
      logoUpdatedAt: new Date(2_000),
      brandColor: "#16a34a",
      hasLogo,
    },
  });

  it("gives the active clinic's color and a logo version that changes with the logo", () => {
    expect(
      sessionBranding([membership("a", false), membership("b", true)], "b"),
    ).toEqual({ brandColor: "#16a34a", logoVersion: "2000" });
  });

  it("has no logo version without a logo, and nothing without an active clinic", () => {
    expect(sessionBranding([membership("a", false)], "a")?.logoVersion).toBe(
      null,
    );
    expect(sessionBranding([membership("a", true)], undefined)).toBeNull();
  });
});
