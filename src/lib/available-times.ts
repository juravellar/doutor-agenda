import dayjs from "dayjs";
import { and, eq, gte, lt, ne } from "drizzle-orm";

import type { db } from "@/db";
import type { Transaction } from "@/db/clinic-lock";
import { appointmentsTable, doctorsTable } from "@/db/schema";
import {
  clinicDayRange,
  generateTimeSlots,
  inClinicTimezone,
  isWeekDayInRange,
  utcTimeToClinic,
} from "@/helpers/time";
import { UserFacingError } from "@/lib/action-errors";

// Callers inside withClinicLock must pass its transaction: querying through
// the global pool there needs a second connection while the lock holds one.
export type DbExecutor = typeof db | Transaction;

export interface AvailableTime {
  value: string;
  available: boolean;
  label: string;
}

export const computeAvailableTimes = async (
  executor: DbExecutor,
  params: {
    clinicId: string;
    doctorId: string;
    date: string; // YYYY-MM-DD in clinic time
    ignoreAppointmentId?: string;
  },
): Promise<AvailableTime[]> => {
  const doctor = await executor.query.doctorsTable.findFirst({
    where: eq(doctorsTable.id, params.doctorId),
  });
  if (!doctor || doctor.clinicId !== params.clinicId) {
    // Also reached when the doctor was deleted while a form was open.
    throw new UserFacingError("Médico não encontrado. Atualize a página.");
  }
  const doctorIsAvailable = isWeekDayInRange(
    dayjs(params.date).day(),
    doctor.availableFromWeekDay,
    doctor.availableToWeekDay,
  );
  if (!doctorIsAvailable) {
    return [];
  }

  const { start, end } = clinicDayRange(params.date);
  const appointments = await executor.query.appointmentsTable.findMany({
    where: and(
      eq(appointmentsTable.doctorId, params.doctorId),
      gte(appointmentsTable.date, start),
      lt(appointmentsTable.date, end),
      params.ignoreAppointmentId
        ? ne(appointmentsTable.id, params.ignoreAppointmentId)
        : undefined,
    ),
  });
  const bookedTimes = appointments.map((appointment) =>
    inClinicTimezone(appointment.date).format("HH:mm:ss"),
  );

  const availableFrom = utcTimeToClinic(doctor.availableFromTime).format(
    "HH:mm:ss",
  );
  const availableTo = utcTimeToClinic(doctor.availableToTime).format(
    "HH:mm:ss",
  );
  return generateTimeSlots()
    .filter((time) => time >= availableFrom && time <= availableTo)
    .map((time) => ({
      value: time,
      available: !bookedTimes.includes(time),
      label: time.substring(0, 5),
    }));
};
