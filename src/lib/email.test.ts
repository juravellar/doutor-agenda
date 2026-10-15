import { afterEach, describe, expect, it, vi } from "vitest";

import { isEmailConfigured, sendEmail, verificationEmail } from "./email";

describe("email", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("is off unless both the API key and the sender are set", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "Avelliq <no-reply@avelliq.com>");
    expect(isEmailConfigured()).toBe(false);
    vi.stubEnv("RESEND_API_KEY", "re_123");
    expect(isEmailConfigured()).toBe(true);
  });

  it("does not put the recipient in the error when the provider fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 422 })),
    );

    const sending = sendEmail({
      to: "maria@exemplo.com",
      ...verificationEmail("https://avelliq.vercel.app/x"),
    });

    await expect(sending).rejects.toThrow("Email provider responded 422");
    await expect(sending).rejects.not.toThrow(/maria/);
  });

  it("escapes the link in the HTML body", () => {
    expect(verificationEmail('https://x/"><script>').html).not.toContain(
      "<script>",
    );
  });
});
