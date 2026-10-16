import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clinicChoiceStatus,
  type Membership,
  resolveClinicAccess,
} from "./clinic-access";
import {
  CLINIC_READ_ONLY_MESSAGE,
  FREE_PERIOD_OVER_MESSAGE,
  writeBlock,
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

describe("writeBlock", () => {
  const recent = new Date();

  it("blocks a read-only clinic", () => {
    expect(
      writeBlock({
        plan: "essential",
        freePeriodStartsAt: recent,
        clinic: { writable: false },
      }),
    ).toEqual({ kind: "read-only", message: CLINIC_READ_ONLY_MESSAGE });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("blocks a Free account past its period", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2027-06-01T00:00:00Z"));
    expect(
      writeBlock({
        plan: null,
        freePeriodStartsAt: "2020-01-01T00:00:00Z",
        clinic: { writable: true },
      }),
    ).toEqual({
      kind: "free-period-over",
      message: FREE_PERIOD_OVER_MESSAGE,
    });
  });

  it("allows writing otherwise", () => {
    expect(
      writeBlock({
        plan: null,
        freePeriodStartsAt: recent,
        clinic: { writable: true },
      }),
    ).toBeNull();
  });
});

describe("clinicChoiceStatus", () => {
  const now = new Date("2026-11-20T12:00:00Z");

  it("allows the first choice", () => {
    expect(clinicChoiceStatus(null, null, now).allowed).toBe(true);
  });

  it("allows one correction right after the first choice", () => {
    expect(clinicChoiceStatus("2026-11-20T11:00:00Z", null, now).allowed).toBe(
      true,
    );
  });

  it("blocks further changes for 30 days after a change", () => {
    expect(
      clinicChoiceStatus("2026-11-01T00:00:00Z", "2026-11-10T12:00:00Z", now),
    ).toEqual({
      allowed: false,
      nextChangeAt: new Date("2026-12-10T12:00:00Z"),
    });
  });

  it("allows a change again after 30 days", () => {
    expect(
      clinicChoiceStatus("2026-09-01T00:00:00Z", "2026-10-20T12:00:00Z", now)
        .allowed,
    ).toBe(true);
  });
});
