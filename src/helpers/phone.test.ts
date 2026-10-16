import { describe, expect, it } from "vitest";

import { formatPhone, phoneDigits } from "./phone";

describe("formatPhone", () => {
  it("formats a landline with 10 digits", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });

  it("formats a mobile with 11 digits", () => {
    expect(formatPhone("11999998888")).toBe("(11) 99999-8888");
  });

  it("formats while typing", () => {
    expect(formatPhone("1")).toBe("(1");
    expect(formatPhone("119")).toBe("(11) 9");
    expect(formatPhone("1199999")).toBe("(11) 9999-9");
  });

  it("formats an already formatted number and ignores extra digits", () => {
    expect(formatPhone("(11) 3333-4444")).toBe("(11) 3333-4444");
    expect(formatPhone("119999988887")).toBe("(11) 99999-8888");
  });

  it("is empty without digits", () => {
    expect(formatPhone("")).toBe("");
  });
});

describe("phoneDigits", () => {
  it("keeps only the digits", () => {
    expect(phoneDigits("(11) 3333-4444")).toBe("1133334444");
  });
});
