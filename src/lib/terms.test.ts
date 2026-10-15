import { describe, expect, it } from "vitest";

import {
  needsTermsAcceptance,
  TERMS_VERSION,
  termsAcceptanceForNewUser,
} from "./terms";

const NOW = new Date("2026-10-15T12:00:00Z");

describe("termsAcceptanceForNewUser", () => {
  it("refuses an email sign-up without the acceptance box", () => {
    expect(termsAcceptanceForNewUser("/sign-up/email", null, NOW)).toBeNull();
    expect(
      termsAcceptanceForNewUser("/sign-up/email", "2020-01-01", NOW),
    ).toBeNull();
  });

  it("records the accepted version for an email sign-up", () => {
    expect(
      termsAcceptanceForNewUser("/sign-up/email", TERMS_VERSION, NOW),
    ).toEqual({ termsAcceptedAt: NOW, termsVersion: TERMS_VERSION });
  });

  it("takes the notice next to the Google button as acceptance", () => {
    expect(termsAcceptanceForNewUser("/callback/:id", null, NOW)).toEqual({
      termsAcceptedAt: NOW,
      termsVersion: TERMS_VERSION,
    });
  });
});

describe("needsTermsAcceptance", () => {
  it("asks users who never accepted or accepted an older version", () => {
    expect(needsTermsAcceptance(null)).toBe(true);
    expect(needsTermsAcceptance("2020-01-01")).toBe(true);
    expect(needsTermsAcceptance(TERMS_VERSION)).toBe(false);
  });
});
