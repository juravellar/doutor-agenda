import { describe, expect, it } from "vitest";

import { pageTitle } from "./routes";

describe("pageTitle", () => {
  it("names each page by its first path segment", () => {
    expect(pageTitle("/doctors")).toBe("Médicos");
    expect(pageTitle("/clinic-settings")).toBe("Configurações da clínica");
  });

  it("ignores query and deeper segments", () => {
    expect(pageTitle("/dashboard")).toBe("Dashboard");
    expect(pageTitle("/doctors/123")).toBe("Médicos");
  });

  it("has no title for unknown pages", () => {
    expect(pageTitle("/qualquer")).toBeNull();
    expect(pageTitle("/")).toBeNull();
  });
});
