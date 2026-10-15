"use server";

import { and, eq, gte, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isUniqueViolation, withClinicLock } from "@/db/clinic-lock";
import { appointmentsTable, patientsTable } from "@/db/schema";
import { priceInCentsSchema } from "@/helpers/currency";
import {
  clinicDateTimeToDate,
  clinicMonthRange,
  inClinicTimezone,
} from "@/helpers/time";
import { UserFacingError } from "@/lib/action-errors";
import { computeAvailableTimes } from "@/lib/available-times";
import { clinicWriteActionClient } from "@/lib/clinic-action";
import { ensurePlanAllows } from "@/lib/plan-limits";
import { resolvePlan } from "@/lib/plans";

const SLOT_UNAVAILABLE_MESSAGE =
  "Este horário não está mais disponível. Escolha outro horário.";

export const upsertAppointment = clinicWriteActionClient
  .schema(
    z.object({
      id: z.string().uuid().optional(),
      patientId: z.string().uuid(),
      doctorId: z.string().uuid(),
      date: z.date(),
      time: z.string(),
      appointmentPriceInCents: priceInCentsSchema(
        "Valor da consulta é obrigatório.",
      ),
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const clinicId = ctx.clinic.id;
    const appointmentDay = inClinicTimezone(parsedInput.date).format(
      "YYYY-MM-DD",
    );
    try {
      await withClinicLock(clinicId, async (tx) => {
        const patient = await tx.query.patientsTable.findFirst({
          where: eq(patientsTable.id, parsedInput.patientId),
        });
        if (!patient || patient.clinicId !== clinicId) {
          throw new Error("Paciente não encontrado");
        }

        if (parsedInput.id) {
          const appointment = await tx.query.appointmentsTable.findFirst({
            where: eq(appointmentsTable.id, parsedInput.id),
          });
          if (!appointment || appointment.clinicId !== clinicId) {
            throw new Error("Agendamento não encontrado");
          }
        }

        const availableTimes = await computeAvailableTimes(tx, {
          clinicId,
          doctorId: parsedInput.doctorId,
          date: appointmentDay,
          ignoreAppointmentId: parsedInput.id,
        });
        const isTimeAvailable = availableTimes.some(
          (time) => time.value === parsedInput.time && time.available,
        );
        if (!isTimeAvailable) {
          throw new UserFacingError(SLOT_UNAVAILABLE_MESSAGE);
        }

        const appointmentDate = clinicDateTimeToDate(
          appointmentDay,
          parsedInput.time,
        );

        if (parsedInput.id) {
          await tx
            .update(appointmentsTable)
            .set({
              patientId: parsedInput.patientId,
              doctorId: parsedInput.doctorId,
              date: appointmentDate,
              appointmentPriceInCents: parsedInput.appointmentPriceInCents,
            })
            .where(eq(appointmentsTable.id, parsedInput.id));
          return;
        }

        const { start, end } = clinicMonthRange(appointmentDay);
        const appointmentsInMonth = await tx.$count(
          appointmentsTable,
          and(
            eq(appointmentsTable.clinicId, clinicId),
            gte(appointmentsTable.date, start),
            lt(appointmentsTable.date, end),
          ),
        );
        ensurePlanAllows(
          resolvePlan(ctx.user.plan),
          "appointmentsPerMonth",
          appointmentsInMonth,
        );
        await tx.insert(appointmentsTable).values({
          patientId: parsedInput.patientId,
          doctorId: parsedInput.doctorId,
          date: appointmentDate,
          appointmentPriceInCents: parsedInput.appointmentPriceInCents,
          clinicId,
        });
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new UserFacingError(SLOT_UNAVAILABLE_MESSAGE);
      }
      throw error;
    }

    revalidatePath("/appointments");
  });
