"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

const upsertAppointmentSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  date: z.date(),
  time: z.string().min(1, {
    message: "Horário da consulta é obrigatório.",
  }),
  appointmentPriceInCents: z.number().min(1, {
    message: "Preço da consulta é obrigatório.",
  }),
});

export const upsertAppointment = actionClient
  .inputSchema(upsertAppointmentSchema)
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Não autorizado.");
    }
    if (!session?.user.clinic?.id) {
      throw new Error("Clínica não encontrada");
    }

    const { id, patientId, doctorId, date, time, appointmentPriceInCents } =
      parsedInput;

    const [hours, minutes] = time.split(":").map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    if (id) {
      const appointment = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.id, id),
      });

      if (!appointment) {
        throw new Error("Agendamento não encontrado");
      }

      if (appointment.clinicId !== session.user.clinic.id) {
        throw new Error("Agendamento não encontrado");
      }

      await db
        .update(appointmentsTable)
        .set({
          patientId,
          doctorId,
          date: appointmentDate,
          appointmentPriceInCents,
        })
        .where(eq(appointmentsTable.id, id));
    } else {
      await db.insert(appointmentsTable).values({
        patientId,
        doctorId,
        date: appointmentDate,
        time: time,
        appointmentPriceInCents,
        clinicId: session.user.clinic.id,
      });
    }

    revalidatePath("/appointments");
  });
