"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { doctorsTable } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { clinicWriteActionClient } from "@/lib/clinic-action";

export const deleteDoctor = clinicWriteActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.clinic.id;
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.id),
    });
    if (!doctor) {
      throw new Error("Médico não encontrado");
    }
    if (doctor.clinicId !== clinicId) {
      throw new Error("Médico não encontrado");
    }
    await db.transaction(async (tx) => {
      await tx.delete(doctorsTable).where(eq(doctorsTable.id, parsedInput.id));
      await recordAudit(
        {
          userId: ctx.user.id,
          clinicId,
          action: "doctor.deleted",
          entityId: parsedInput.id,
        },
        tx,
      );
    });
    revalidatePath("/doctors");
  });
