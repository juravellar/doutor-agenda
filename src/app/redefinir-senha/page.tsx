import type { Metadata } from "next";

import { AuthPageShell } from "../_components/auth-page-shell";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nova senha | Avelliq" };

// Better Auth sends the user here from the email link, with ?token=... when the
// link is valid or ?error=INVALID_TOKEN when it expired or was already used.
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;
  return (
    <AuthPageShell>
      <ResetPasswordForm token={error ? null : (token ?? null)} />
    </AuthPageShell>
  );
}
