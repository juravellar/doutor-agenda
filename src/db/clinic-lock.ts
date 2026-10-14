import { sql } from "drizzle-orm";

import { db } from "@/db";

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Runs fn in a transaction holding a lock on the clinic, so writes that first
// check plan limits or free slots can't interleave and both pass the check.
export const withClinicLock = <T>(
  clinicId: string,
  fn: (tx: Transaction) => Promise<T>,
) =>
  db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${clinicId}))`);
    return fn(tx);
  });

// Postgres unique_violation, possibly wrapped by Drizzle.
export const isUniqueViolation = (error: unknown) => {
  const code = (error as { code?: string; cause?: { code?: string } })?.code;
  const causeCode = (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505" || causeCode === "23505";
};
