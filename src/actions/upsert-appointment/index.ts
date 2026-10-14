"use server";

import { and, eq, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, patientsTable } from "@/db/schema";
import {
  clinicDateTimeToDate,
  clinicMonthRange,
  inClinicTimezone,
} from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { ensurePlanAllows } from "@/lib/plan-limits";
import { resolvePlan } from "@/lib/plans";

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
    const patient = await db.query.patientsTable.findFirst({
      where: eq(patientsTable.id, parsedInput.patientId),
    });
    if (!patient || patient.clinicId !== session.user.clinic.id) {
      throw new Error("Paciente não encontrado");
    }

    const appointmentDay = inClinicTimezone(parsedInput.date).format(
      "YYYY-MM-DD",
    );
    const availableTimes = await getAvailableTimes({
      doctorId: parsedInput.doctorId,
      date: appointmentDay,
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

    const appointmentDate = clinicDateTimeToDate(
      appointmentDay,
      parsedInput.time,
    );

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
      const { start, end } = clinicMonthRange(appointmentDay);
      const appointmentsInMonth = await db.$count(
        appointmentsTable,
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, start),
          lt(appointmentsTable.date, end),
        ),
      );
      ensurePlanAllows(
        resolvePlan(session.user.plan),
        "appointmentsPerMonth",
        appointmentsInMonth,
      );
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
