"use server";

import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";

import { db } from "@/db";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import {
  generateTimeSlots,
  inClinicTimezone,
  utcTimeToClinic,
} from "@/helpers/time";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";

export const getAvailableTimes = actionClient
  .schema(
    z.object({
      doctorId: z.string(),
      date: z.string().date(), // YYYY-MM-DD,
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
    const selectedDayOfWeek = dayjs(parsedInput.date).day();
    const doctorIsAvailable =
      selectedDayOfWeek >= doctor.availableFromWeekDay &&
      selectedDayOfWeek <= doctor.availableToWeekDay;
    if (!doctorIsAvailable) {
      return [];
    }
    const appointments = await db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.doctorId, parsedInput.doctorId),
    });
    const appointmentsOnSelectedDate = appointments
      .map((appointment) => inClinicTimezone(appointment.date))
      .filter((date) => date.format("YYYY-MM-DD") === parsedInput.date)
      .map((date) => date.format("HH:mm:ss"));
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
