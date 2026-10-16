import { describe, expect, it } from "vitest";

import { dashboardRange } from "./dashboard-range";

const today = "2026-10-16";

describe("dashboardRange", () => {
  it("shows the next month without dates", () => {
    expect(dashboardRange({}, today)).toEqual({
      from: "2026-10-16",
      to: "2026-11-16",
    });
  });

  it("counts the default month from a start picked beyond it", () => {
    expect(dashboardRange({ from: "2026-12-20" }, today)).toEqual({
      from: "2026-12-20",
      to: "2027-01-20",
    });
  });

  it("never ends before it starts", () => {
    expect(
      dashboardRange({ from: "2026-12-20", to: "2026-11-01" }, today),
    ).toEqual({
      from: "2026-12-20",
      to: "2026-12-20",
    });
  });

  it("keeps a valid range as it is", () => {
    expect(
      dashboardRange({ from: "2026-10-01", to: "2026-10-31" }, today),
    ).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });

  it("ignores dates that aren't real calendar days", () => {
    expect(dashboardRange({ from: "abc", to: "16/10/2026" }, today)).toEqual({
      from: "2026-10-16",
      to: "2026-11-16",
    });
    expect(
      dashboardRange({ from: "2026-02-31", to: "2026-13-01" }, today),
    ).toEqual({ from: "2026-10-16", to: "2026-11-16" });
  });

  it("keeps a valid start when only the end is malformed", () => {
    expect(dashboardRange({ from: "2026-12-01", to: "x" }, today)).toEqual({
      from: "2026-12-01",
      to: "2027-01-01",
    });
  });
});
