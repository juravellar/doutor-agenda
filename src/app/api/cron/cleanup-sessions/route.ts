import { lt } from "drizzle-orm";

import { db } from "@/db";
import { sessionsTable, verificationsTable } from "@/db/schema";

// Sessions keep the IP address and browser of each sign-in. Once expired they
// serve no purpose, so they are deleted instead of piling up (LGPD art. 16).
// Called daily by Vercel Cron, which sends CRON_SECRET as a bearer token.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const now = new Date();
  const [sessions, verifications] = await Promise.all([
    db
      .delete(sessionsTable)
      .where(lt(sessionsTable.expiresAt, now))
      .returning({ id: sessionsTable.id }),
    db
      .delete(verificationsTable)
      .where(lt(verificationsTable.expiresAt, now))
      .returning({ id: verificationsTable.id }),
  ]);
  return Response.json({
    deletedSessions: sessions.length,
    deletedVerifications: verifications.length,
  });
}
