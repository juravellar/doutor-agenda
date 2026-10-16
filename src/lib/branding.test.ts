import { describe, expect, it } from "vitest";

import {
  BRAND_COLOR_PRESETS,
  brandColorWarning,
  brandStyle,
  clinicLogoUrl,
  contrastRatio,
  decodeLogo,
  LOGO_DATA_URL_PATTERN,
  readableTextOn,
} from "./branding";

describe("readableTextOn", () => {
  it("puts white on dark colors and dark text on light ones", () => {
    expect(readableTextOn("#1e3a8a")).toBe("#ffffff");
    expect(readableTextOn("#facc15")).toBe("#0a0a0a");
  });

  it("keeps every preset readable (WCAG AA for large text)", () => {
    for (const { color } of BRAND_COLOR_PRESETS) {
      expect(
        contrastRatio(readableTextOn(color), color),
      ).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("brandStyle", () => {
  it("overrides the primary color and its text", () => {
    expect(brandStyle("#16a34a")).toMatchObject({
      "--primary": "#16a34a",
      "--primary-foreground": readableTextOn("#16a34a"),
    });
  });

  it("ignores missing or malformed colors", () => {
    expect(brandStyle(null)).toBeUndefined();
    expect(brandStyle("red; background: url(x)")).toBeUndefined();
  });
});

describe("LOGO_DATA_URL_PATTERN", () => {
  it("accepts raster images only", () => {
    expect(
      LOGO_DATA_URL_PATTERN.test("data:image/png;base64,iVBORw0KGgo="),
    ).toBe(true);
    expect(LOGO_DATA_URL_PATTERN.test("data:image/webp;base64,UklGRg==")).toBe(
      true,
    );
    expect(
      LOGO_DATA_URL_PATTERN.test("data:image/svg+xml;base64,PHN2Zz4="),
    ).toBe(false);
    expect(LOGO_DATA_URL_PATTERN.test("https://evil.example/logo.png")).toBe(
      false,
    );
    expect(
      LOGO_DATA_URL_PATTERN.test('data:image/png;base64,AAA" onerror="x'),
    ).toBe(false);
  });
});

describe("brandStylesheet", () => {
  it("overrides both themes at the document root", async () => {
    const { brandStylesheet } = await import("./branding");
    expect(brandStylesheet("#16a34a")).toMatch(
      /^:root,:root\.dark\{--primary:#16a34a;--primary-foreground:#[0-9a-f]{6};/,
    );
  });

  it("emits nothing for an invalid color, so nothing can be injected", async () => {
    const { brandStylesheet } = await import("./branding");
    expect(brandStylesheet("#fff}body{display:none")).toBeNull();
    expect(brandStylesheet("")).toBeNull();
  });
});

describe("decodeLogo", () => {
  it("turns a stored data URL into an image file", () => {
    expect(decodeLogo("data:image/webp;base64,UklGRg==")).toEqual({
      contentType: "image/webp",
      base64: "UklGRg==",
    });
  });

  it("refuses anything that is not an accepted raster format", () => {
    expect(decodeLogo("data:image/svg+xml;base64,PHN2Zz4=")).toBeNull();
    expect(decodeLogo("https://example.com/logo.png")).toBeNull();
    expect(decodeLogo(null)).toBeNull();
  });
});

describe("clinicLogoUrl", () => {
  it("carries the version so a new logo gets a new URL", () => {
    expect(clinicLogoUrl("c1", "abc")).toBe("/api/clinics/c1/logo?v=abc");
  });
});

describe("brandColorWarning", () => {
  it("accepts every preset in both themes", () => {
    for (const { color } of BRAND_COLOR_PRESETS) {
      expect(brandColorWarning(color)).toBeNull();
    }
  });

  it("warns about colors too light for the light theme or too dark for the dark one", () => {
    expect(brandColorWarning("#fde047")).toContain("tema claro");
    expect(brandColorWarning("#1e293b")).toContain("tema escuro");
  });
});
