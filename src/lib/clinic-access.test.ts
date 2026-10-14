import { afterEach, describe, expect, it, vi } from "vitest";

import { type Membership, resolveClinicAccess } from "./clinic-access";
import {
  CLINIC_READ_ONLY_MESSAGE,
  FREE_PERIOD_OVER_MESSAGE,
  writeBlockReason,
} from "./free-period";

const membership = (
  clinicId: string,
  month: number,
  keptInPlan = false,
): Membership => ({
  clinicId,
  name: clinicId,
  clinicCreatedAt: new Date(Date.UTC(2026, month, 1)),
  memberSince: new Date(Date.UTC(2026, month, 1)),
  keptInPlan,
});

const centro = membership("centro", 0);
const norte = membership("norte", 2);
const sul = membership("sul", 4);

const writable = (access: ReturnType<typeof resolveClinicAccess>) =>
  access.clinics.filter((c) => c.writable).map((c) => c.id);

describe("resolveClinicAccess", () => {
  it("keeps every clinic usable within the plan", () => {
    const access = resolveClinicAccess(
      [centro, norte, sul],
      null,
      "professional",
    );
    expect(writable(access)).toEqual(["centro", "norte", "sul"]);
    expect(access.overClinicLimit).toBe(false);
  });

  it("keeps the oldest clinics usable after a downgrade without a choice", () => {
    const access = resolveClinicAccess([sul, centro, norte], null, "essential");
    expect(writable(access)).toEqual(["centro", "norte"]);
    expect(access.overClinicLimit).toBe(true);
  });

  it("keeps the clinics the user chose", () => {
    const access = resolveClinicAccess(
      [centro, norte, membership("sul", 4, true)],
      null,
      null,
    );
    expect(writable(access)).toEqual(["sul"]);
  });

  it("uses the chosen clinics first, then the oldest, up to the limit", () => {
    const access = resolveClinicAccess(
      [centro, norte, membership("sul", 4, true)],
      null,
      "essential",
    );
    expect(writable(access)).toEqual(["centro", "sul"]);
  });

  it("activates the selected clinic only if it is the user's", () => {
    expect(
      resolveClinicAccess([centro, norte], "norte", "essential").active?.id,
    ).toBe("norte");
    expect(
      resolveClinicAccess([centro, norte], "someone-elses", "essential").active
        ?.id,
    ).toBe("centro");
  });

  it("falls back to a usable clinic when the selected one is read-only", () => {
    const access = resolveClinicAccess([centro, norte], null, null);
    expect(access.active?.id).toBe("centro");
    // Selecting a read-only clinic still opens it, for reading.
    const readOnly = resolveClinicAccess([centro, norte], "norte", null);
    expect(readOnly.active).toMatchObject({ id: "norte", writable: false });
  });

  it("starts the free period at the user's first clinic", () => {
    const access = resolveClinicAccess([sul, centro], "sul", null);
    expect(access.freePeriodStartsAt?.toISOString()).toBe(
      centro.clinicCreatedAt.toISOString(),
    );
  });

  it("has no clinic before the first one is created", () => {
    expect(resolveClinicAccess([], null, null)).toMatchObject({
      active: null,
      clinics: [],
      freePeriodStartsAt: null,
    });
  });
});

describe("writeBlockReason", () => {
  const recent = new Date();

  it("blocks a read-only clinic", () => {
    expect(
      writeBlockReason({
        plan: "essential",
        freePeriodStartsAt: recent,
        clinic: { writable: false },
      }),
    ).toBe(CLINIC_READ_ONLY_MESSAGE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks a Free account past its period", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-06-01T00:00:00Z"));
    expect(
      writeBlockReason({
        plan: null,
        freePeriodStartsAt: "2020-01-01T00:00:00Z",
        clinic: { writable: true },
      }),
    ).toBe(FREE_PERIOD_OVER_MESSAGE);
  });

  it("allows writing otherwise", () => {
    expect(
      writeBlockReason({
        plan: null,
        freePeriodStartsAt: recent,
        clinic: { writable: true },
      }),
    ).toBeNull();
  });
});
