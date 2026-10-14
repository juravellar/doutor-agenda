"use server";

import dayjs from "dayjs";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import {
  clinicDayRange,
  generateTimeSlots,
  inClinicTimezone,
  isWeekDayInRange,
  utcTimeToClinic,
} from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
      // The appointment being edited, whose own slot must stay selectable.
      ignoreAppointmentId: z.string().uuid().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      throw new Error("Unauthorized");
    }
    if (!session.user.clinic) {
      throw new Error("Clínica não encontrada");
    }
    const doctor = await db.query.doctorsTable.findFirst({
      where: eq(doctorsTable.id, parsedInput.doctorId),
    });
    if (!doctor || doctor.clinicId !== session.user.clinic.id) {
      throw new Error("Médico não encontrado");
    }
    const doctorIsAvailable = isWeekDayInRange(
      dayjs(parsedInput.date).day(),
      doctor.availableFromWeekDay,
      doctor.availableToWeekDay,
    );
    if (!doctorIsAvailable) {
      return [];
    }
    const { start, end } = clinicDayRange(parsedInput.date);
    const appointments = await db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.doctorId, parsedInput.doctorId),
        gte(appointmentsTable.date, start),
        lt(appointmentsTable.date, end),
        parsedInput.ignoreAppointmentId
          ? ne(appointmentsTable.id, parsedInput.ignoreAppointmentId)
          : undefined,
      ),
    });
    const appointmentsOnSelectedDate = appointments.map((appointment) =>
      inClinicTimezone(appointment.date).format("HH:mm:ss"),
    );
    const timeSlots = generateTimeSlots();

    const doctorAvailableFrom = utcTimeToClinic(
      doctor.availableFromTime,
    ).format("HH:mm:ss");
    const doctorAvailableTo = utcTimeToClinic(doctor.availableToTime).format(
      "HH:mm:ss",
    );
    const doctorTimeSlots = timeSlots.filter(
      (time) => time >= doctorAvailableFrom && time <= doctorAvailableTo,
    );
    return doctorTimeSlots.map((time) => {
      return {
        value: time,
        available: !appointmentsOnSelectedDate.includes(time),
        label: time.substring(0, 5),
      };
    });
  });
