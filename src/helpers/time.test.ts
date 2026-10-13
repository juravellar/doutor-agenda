import { describe, expect, it } from "vitest";

import {
  clinicDateTimeToDate,
  clinicTimeToUtc,
  generateTimeSlots,
  inClinicTimezone,
  utcTimeToClinic,
} from "./time";

describe("clinicTimeToUtc", () => {
  it("converts clinic time to UTC", () => {
    expect(clinicTimeToUtc("08:00:00")).toBe("11:00:00");
    expect(clinicTimeToUtc("15:30:00")).toBe("18:30:00");
  });

  it("wraps past midnight", () => {
    expect(clinicTimeToUtc("22:30:00")).toBe("01:30:00");
  });
});

describe("utcTimeToClinic", () => {
  it("converts UTC back to clinic time", () => {
    expect(utcTimeToClinic("11:00:00").format("HH:mm:ss")).toBe("08:00:00");
    expect(utcTimeToClinic("01:30:00").format("HH:mm:ss")).toBe("22:30:00");
  });

  it("round-trips without drift", () => {
    for (const slot of generateTimeSlots()) {
      expect(utcTimeToClinic(clinicTimeToUtc(slot)).format("HH:mm:ss")).toBe(
        slot,
      );
    }
  });

  it("keeps the requested weekday after crossing midnight", () => {
    const friday = utcTimeToClinic("01:30:00").day(5);
    expect(friday.day()).toBe(5);
    expect(friday.format("HH:mm")).toBe("22:30");
  });
});

describe("clinicDateTimeToDate", () => {
  it("builds the instant of a clinic date and time", () => {
    expect(clinicDateTimeToDate("2026-10-12", "08:00:00").toISOString()).toBe(
      "2026-10-12T11:00:00.000Z",
    );
  });

  it("rolls into the next UTC day for late appointments", () => {
    expect(clinicDateTimeToDate("2026-10-12", "22:30:00").toISOString()).toBe(
      "2026-10-13T01:30:00.000Z",
    );
  });
});

describe("inClinicTimezone", () => {
  it("reads an instant back as clinic date and time", () => {
    const date = inClinicTimezone(new Date("2026-10-13T01:30:00.000Z"));
    expect(date.format("YYYY-MM-DD HH:mm")).toBe("2026-10-12 22:30");
  });
});
