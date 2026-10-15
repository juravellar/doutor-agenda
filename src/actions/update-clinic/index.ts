"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { clinicWriteActionClient } from "@/lib/clinic-action";

import { updateClinicSchema } from "./schema";

export const updateClinic = clinicWriteActionClient
  .schema(updateClinicSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db.transaction(async (tx) => {
      await tx
        .update(clinicsTable)
        .set({
          name: parsedInput.name,
          address: parsedInput.address || null,
          phoneNumber: parsedInput.phoneNumber || null,
        })
        .where(eq(clinicsTable.id, ctx.clinic.id));
      await recordAudit(
        {
          userId: ctx.user.id,
          clinicId: ctx.clinic.id,
          action: "clinic.updated",
          entityId: ctx.clinic.id,
        },
        tx,
      );
    });
    revalidatePath("/", "layout");
  });
