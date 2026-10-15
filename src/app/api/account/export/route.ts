import { headers } from "next/headers";

import { collectAccountData } from "@/lib/account-data";
import { recordAudit } from "@/lib/audit";
import { auth } from "@/lib/auth";

// Download of everything stored about the signed-in user and their clinics.
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const data = await collectAccountData(session.user.id);
  if (!data) {
    return new Response("Not found", { status: 404 });
  }
  await recordAudit({
    userId: session.user.id,
    clinicId: null,
    action: "account.exported",
    entityId: session.user.id,
  });
  const day = data.exportedAt.slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="avelliq-meus-dados-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
