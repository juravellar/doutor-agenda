import { describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.mock("@/db", () => ({
  db: { query: { usersToClinicsTable: { findMany } } },
}));

import { loadSessionMemberships } from "./session-memberships";

describe("loadSessionMemberships", () => {
  it("never loads the clinics' logos, only the columns the session uses", async () => {
    await loadSessionMemberships("user_1");

    const { with: relations } = findMany.mock.calls[0][0];
    expect(relations.clinic.columns).toEqual({
      id: true,
      name: true,
      createdAt: true,
    });
    expect(relations.clinic.columns).not.toHaveProperty("logoDataUrl");
  });
});
