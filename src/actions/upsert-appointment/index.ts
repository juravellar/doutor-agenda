"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

import { getAvailableTimes } from "../get-available-times";

export const upsertAppointment = actionClient
  .schema(
    z.object({
      id: z.string().uuid().optional(),
      patientId: z.string().uuid(),
      doctorId: z.string().uuid(),
      date: z.date(),
      time: z.string(),
      appointmentPriceInCents: z.number(),
    }),
  )
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

    const availableTimes = await getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: dayjs(parsedInput.date).format("YYYY-MM-DD"),
    });

    if (!availableTimes?.data) {
      throw new Error("Horário não encontrado");
    }

    const isTimeAvailable = availableTimes.data?.some(
      (time) => time.value === parsedInput.time && time.available,
    );

    if (!isTimeAvailable) {
      throw new Error("Horário não encontrado");
    }

    const [hours, minutes] = parsedInput.time.split(":").map(Number);
    const appointmentDate = new Date(parsedInput.date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    if (parsedInput.id) {
      const appointment = await db.query.appointmentsTable.findFirst({
        where: eq(appointmentsTable.id, parsedInput.id),
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
          patientId: parsedInput.patientId,
          doctorId: parsedInput.doctorId,
          date: appointmentDate,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents,
        })
        .where(eq(appointmentsTable.id, parsedInput.id));
    } else {
      await db.insert(appointmentsTable).values({
        patientId: parsedInput.patientId,
        doctorId: parsedInput.doctorId,
        date: appointmentDate,
        appointmentPriceInCents: parsedInput.appointmentPriceInCents,
        clinicId: session.user.clinic.id,
      });
    }

    revalidatePath("/appointments");
  });
