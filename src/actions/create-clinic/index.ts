"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { withUserLock } from "@/db/clinic-lock";
import { clinicsTable, usersTable, usersToClinicsTable } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { resolvePlan } from "@/lib/plans";

import { auth } from "../../lib/auth";

const clinicNameSchema = z.string().trim().min(1).max(120);

export const createClinic = async (rawName: string) => {
  const name = clinicNameSchema.parse(rawName);
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
    // A clinic can only be created within the plan's limit, where the earlier
    // choice of active clinics has no effect. Clearing it means a later
    // downgrade asks again, over the clinics the user has by then.
    await tx
      .update(usersToClinicsTable)
      .set({ keptInPlan: false })
      .where(eq(usersToClinicsTable.userId, session.user.id));
    await tx
      .update(usersTable)
      .set({
        activeClinicId: clinic.id,
        clinicChoiceMadeAt: null,
        clinicChoiceChangedAt: null,
      })
      .where(eq(usersTable.id, session.user.id));
    await recordAudit(
      {
        userId: session.user.id,
        clinicId: clinic.id,
        action: "clinic.created",
        entityId: clinic.id,
      },
      tx,
    );
    return true;
  });

  if (created) {
    // The new clinic becomes the active one, which the layout reads.
    revalidatePath("/", "layout");
  }
  redirect(created ? "/painel" : "/clinicas");
};
