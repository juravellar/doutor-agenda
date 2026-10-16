"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { patientsTable } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { clinicWriteActionClient } from "@/lib/clinic-action";

export const deletePatient = clinicWriteActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.clinic.id;
    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.id),
    });
    if (!patient) {
      throw new Error("Paciente não encontrado");
    }
    if (patient.clinicId !== clinicId) {
      throw new Error("Paciente não encontrado");
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(patientsTable)
        .where(eq(patientsTable.id, parsedInput.id));
      await recordAudit(
        {
          userId: ctx.user.id,
          clinicId,
          action: "patient.deleted",
          entityId: parsedInput.id,
        },
        tx,
      );
    });
    revalidatePath("/pacientes");
  });
