import { beforeEach, describe, expect, it, vi } from "vitest";

const getServerSession = vi.hoisted(() => vi.fn());
const findFirst = vi.hoisted(() => vi.fn());
vi.mock("@/lib/server-session", () => ({ getServerSession }));
vi.mock("@/db", () => ({
  db: { query: { clinicsTable: { findFirst } } },
}));

import { GET } from "./route";

const request = (clinicId: string) =>
  GET(new Request("http://localhost"), {
    params: Promise.resolve({ clinicId }),
  });

describe("GET /api/clinics/[clinicId]/logo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getServerSession.mockResolvedValue({
      user: { clinics: [{ id: "mine" }] },
    });
    findFirst.mockResolvedValue({
      logoDataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });
  });

  it("serves the logo of a clinic the user belongs to, cacheable", async () => {
    const response = await request("mine");

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toContain("immutable");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array(Buffer.from("iVBORw0KGgo=", "base64")),
    );
  });

  it("hides other clinics' logos without querying them", async () => {
    const response = await request("someone-else");

    expect(response.status).toBe(404);
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("asks for a session", async () => {
    getServerSession.mockResolvedValue(null);

    expect((await request("mine")).status).toBe(401);
  });

  it("answers 404 when the clinic has no logo", async () => {
    findFirst.mockResolvedValue({ logoDataUrl: null });

    expect((await request("mine")).status).toBe(404);
  });
});
