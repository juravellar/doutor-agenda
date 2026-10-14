"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { withUserLock } from "@/db/clinic-lock";
import { clinicsTable, usersToClinicsTable } from "@/db/schema";

import { auth } from "../../lib/auth";

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  // One clinic per user: a second one would also restart the free period.
  // Checked in the database under the user's lock, since concurrent submits
  // share the same session snapshot.
  await withUserLock(session.user.id, async (tx) => {
    const existing = await tx.query.usersToClinicsTable.findFirst({
      where: eq(usersToClinicsTable.userId, session.user.id),
    });
    if (existing) {
      return;
    }
    const [clinic] = await tx
      .insert(clinicsTable)
      .values({
        name,
      })
      .returning();
    await tx.insert(usersToClinicsTable).values({
      userId: session.user.id,
      clinicId: clinic.id,
    });
  });

  redirect("/dashboard");
};
