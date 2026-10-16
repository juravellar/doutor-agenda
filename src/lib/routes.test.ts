import { describe, expect, it } from "vitest";

import { pageTitle } from "./routes";

describe("pageTitle", () => {
  it("names each page by its first path segment", () => {
    expect(pageTitle("/medicos")).toBe("Médicos");
    expect(pageTitle("/configuracoes-da-clinica")).toBe(
      "Configurações da clínica",
    );
  });

  it("ignores query and deeper segments", () => {
    expect(pageTitle("/painel")).toBe("Dashboard");
    expect(pageTitle("/medicos/123")).toBe("Médicos");
  });

  it("has no title for unknown pages", () => {
    expect(pageTitle("/qualquer")).toBeNull();
    expect(pageTitle("/")).toBeNull();
  });
});
