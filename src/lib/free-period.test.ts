import { describe, expect, it } from "vitest";

import {
  FREE_PERIOD_LAUNCH,
  freePeriodDaysLeft,
  freePeriodEndsAt,
  isReadOnly,
} from "./free-period";

describe("freePeriodEndsAt", () => {
  it("ends 3 months after the clinic was created", () => {
    expect(freePeriodEndsAt("2026-11-10T15:00:00.000Z").toISOString()).toBe(
      "2027-02-10T15:00:00.000Z",
    );
  });

  it("counts from the launch for clinics created before it", () => {
    expect(freePeriodEndsAt("2025-06-01T12:00:00.000Z").toISOString()).toBe(
      new Date("2027-01-15T03:00:00.000Z").toISOString(),
    );
    expect(FREE_PERIOD_LAUNCH.toISOString()).toBe("2026-10-15T03:00:00.000Z");
  });
});

describe("isReadOnly", () => {
  const createdAt = "2026-11-10T15:00:00.000Z";

  it("lets a Free clinic write during its period", () => {
    expect(isReadOnly(null, createdAt, new Date("2027-02-10T14:59:59Z"))).toBe(
      false,
    );
  });

  it("makes a Free clinic read-only once the period ends", () => {
    expect(isReadOnly(null, createdAt, new Date("2027-02-10T15:00:00Z"))).toBe(
      true,
    );
  });

  it("never limits paid plans", () => {
    const later = new Date("2030-01-01T00:00:00Z");
    expect(isReadOnly("essential", createdAt, later)).toBe(false);
    expect(isReadOnly("professional", createdAt, later)).toBe(false);
  });
});

describe("freePeriodDaysLeft", () => {
  it("counts whole days left and stops at zero", () => {
    const createdAt = "2026-11-10T15:00:00.000Z";
    expect(
      freePeriodDaysLeft(createdAt, new Date("2027-02-01T15:00:00Z")),
    ).toBe(9);
    expect(
      freePeriodDaysLeft(createdAt, new Date("2027-03-01T00:00:00Z")),
    ).toBe(0);
  });
});
