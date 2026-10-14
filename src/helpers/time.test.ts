import { describe, expect, it } from "vitest";

import {
  clinicDateTimeToDate,
  clinicDayRange,
  clinicMonthRange,
  clinicTimeToUtc,
  generateTimeSlots,
  inClinicTimezone,
  isWeekDayInRange,
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

describe("clinicMonthRange", () => {
  it("covers the clinic-time month of the given date", () => {
    const { start, end } = clinicMonthRange("2026-10-14");
    expect(start.toISOString()).toBe("2026-10-01T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-11-01T03:00:00.000Z");
  });
});

describe("clinicDayRange", () => {
  it("covers the clinic-time day", () => {
    const { start, end } = clinicDayRange("2026-10-12");
    expect(start.toISOString()).toBe("2026-10-12T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-10-13T03:00:00.000Z");
  });
});

describe("isWeekDayInRange", () => {
  it("handles a range inside the week", () => {
    expect(isWeekDayInRange(1, 1, 5)).toBe(true);
    expect(isWeekDayInRange(5, 1, 5)).toBe(true);
    expect(isWeekDayInRange(6, 1, 5)).toBe(false);
  });

  it("handles a range that wraps around the weekend", () => {
    expect([6, 0, 1].map((day) => isWeekDayInRange(day, 6, 1))).toEqual([
      true,
      true,
      true,
    ]);
    expect([2, 3, 4, 5].some((day) => isWeekDayInRange(day, 6, 1))).toBe(false);
  });

  it("handles a single day", () => {
    expect(isWeekDayInRange(3, 3, 3)).toBe(true);
    expect(isWeekDayInRange(4, 3, 3)).toBe(false);
  });
});
