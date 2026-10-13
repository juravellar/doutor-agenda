import { describe, expect, it } from "vitest";

import { clinicTimeToUtc, generateTimeSlots, utcTimeToClinic } from "./time";

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
