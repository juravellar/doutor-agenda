"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { clinicWriteActionClient } from "@/lib/clinic-action";

export const deleteAppointment = clinicWriteActionClient
  .schema(
    z.object({
      id: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.clinic.id;
    const appointment = await db.query.appointmentsTable.findFirst({
      where: eq(appointmentsTable.id, parsedInput.id),
    });
    if (!appointment) {
      throw new Error("Agendamento não encontrado");
    }
    if (appointment.clinicId !== clinicId) {
      throw new Error("Agendamento não encontrado");
    }
    await db.transaction(async (tx) => {
      await tx
        .delete(appointmentsTable)
        .where(eq(appointmentsTable.id, parsedInput.id));
      await recordAudit(
        {
          userId: ctx.user.id,
          clinicId,
          action: "appointment.deleted",
          entityId: parsedInput.id,
        },
        tx,
      );
    });
    revalidatePath("/agendamentos");
  });
