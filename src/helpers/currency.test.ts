import { describe, expect, it } from "vitest";

import { digitsToReais, formatReais } from "./currency";

const nbsp = (text: string) => text.replace(/ /g, " ");

describe("currency input", () => {
  it("fills cents from the right as digits are typed", () => {
    expect(digitsToReais("1")).toBe(0.01);
    expect(digitsToReais("15")).toBe(0.15);
    expect(digitsToReais("15000")).toBe(150);
  });

  it("reads the formatted text back, so typing after it keeps working", () => {
    expect(digitsToReais("R$ 150,00" + "5")).toBe(1500.05);
    expect(digitsToReais("R$ 1.234,5")).toBe(123.45);
  });

  it("treats an emptied field as zero and caps absurd lengths", () => {
    expect(digitsToReais("")).toBe(0);
    expect(digitsToReais("R$ ")).toBe(0);
    expect(digitsToReais("9".repeat(20))).toBe(9999999.99);
  });

  it("shows nothing for zero, so the placeholder appears", () => {
    expect(formatReais(0)).toBe("");
    expect(nbsp(formatReais(1234.5))).toBe("R$ 1.234,50");
  });
});
