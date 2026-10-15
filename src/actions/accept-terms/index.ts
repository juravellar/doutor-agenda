"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { TERMS_VERSION } from "@/lib/terms";
import { userActionClient } from "@/lib/user-action";

export const acceptTerms = userActionClient
  // The version the user read, so a version published while the dialog was
  // open isn't recorded as accepted.
  .schema(z.object({ version: z.literal(TERMS_VERSION) }))
  .action(async ({ ctx }) => {
    await db
      .update(usersTable)
      .set({ termsAcceptedAt: new Date(), termsVersion: TERMS_VERSION })
      .where(eq(usersTable.id, ctx.user.id));
  });
