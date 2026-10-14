"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { withUserLock } from "@/db/clinic-lock";
import { clinicsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { resolvePlan } from "@/lib/plans";

import { auth } from "../../lib/auth";

export const createClinic = async (name: string) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const clinicLimit = resolvePlan(session.user.plan).limits.clinics;

  // Counted in the database under the user's lock, so a double submit can't
  // create more clinics than the plan allows.
  const created = await withUserLock(session.user.id, async (tx) => {
    const clinicCount = await tx.$count(
      usersToClinicsTable,
      eq(usersToClinicsTable.userId, session.user.id),
    );
    if (clinicLimit !== null && clinicCount >= clinicLimit) {
      return false;
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
    await tx
      .update(usersTable)
      .set({ activeClinicId: clinic.id })
      .where(eq(usersTable.id, session.user.id));
    return true;
  });

  redirect(created ? "/dashboard" : "/clinics");
};
