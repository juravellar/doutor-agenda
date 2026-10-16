import { describe, expect, it } from "vitest";

import { formatCpf, isValidCpf } from "./cpf";

describe("isValidCpf", () => {
  it("accepts valid CPFs with or without punctuation", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("rejects wrong verification digits", () => {
    expect(isValidCpf("529.982.247-24")).toBe(false);
  });

  it("rejects repeated digits and wrong lengths", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("5299822472")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });

  it("formats 11 digits", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });
});
