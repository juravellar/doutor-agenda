import dayjs from "dayjs";
import { and, count, desc, eq, gte, lt, sql, sum } from "drizzle-orm";

import { PATIENT_OPTION_COLUMNS } from "@/app/(protected)/agendamentos/_components/patient-option";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { CLINIC_TIMEZONE, clinicDayRange, clinicToday } from "@/helpers/time";

interface Params {
  from: string;
  to: string;
  session: {
    user: {
      clinic: {
        id: string;
      };
    };
  };
}

// Appointment dates are stored in UTC; days are counted in clinic time.
const appointmentClinicDay = sql<string>`DATE(${appointmentsTable.date} AT TIME ZONE 'UTC' AT TIME ZONE ${sql.raw(`'${CLINIC_TIMEZONE}'`)})`;

export const getDashboard = async ({ from, to, session }: Params) => {
  // from and to are clinic dates and both days are included in full.
  const periodStart = clinicDayRange(from).start;
  const periodEnd = clinicDayRange(to).end;
  const today = clinicDayRange(clinicToday());
  const chartStartDate = clinicDayRange(
    dayjs(clinicToday()).subtract(10, "days").format("YYYY-MM-DD"),
  ).start;
  const chartEndDate = clinicDayRange(
    dayjs(clinicToday()).add(10, "days").format("YYYY-MM-DD"),
  ).end;

  const [
    [totalRevenue],
    [totalAppointments],
    [totalPatients],
    [totalDoctors],
    topDoctors,
    topSpecialties,
    todayAppointments,
    allPatients,
    allDoctors,
    dailyAppointmentsData,
  ] = await Promise.all([
    db
      .select({
        total: sum(appointmentsTable.appointmentPriceInCents),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, periodStart),
          lt(appointmentsTable.date, periodEnd),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, periodStart),
          lt(appointmentsTable.date, periodEnd),
        ),
      ),
    db
      .select({
        total: count(),
      })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        total: count(),
      })
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        id: doctorsTable.id,
        name: doctorsTable.name,
        avatarImageUrl: doctorsTable.avatarImageUrl,
        specialty: doctorsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(doctorsTable)
      .leftJoin(
        appointmentsTable,
        and(
          eq(appointmentsTable.doctorId, doctorsTable.id),
          gte(appointmentsTable.date, periodStart),
          lt(appointmentsTable.date, periodEnd),
        ),
      )
      .where(eq(doctorsTable.clinicId, session.user.clinic.id))
      .groupBy(doctorsTable.id)
      .orderBy(desc(count(appointmentsTable.id)))
      .limit(10),
    db
      .select({
        specialty: doctorsTable.specialty,
        appointments: count(appointmentsTable.id),
      })
      .from(appointmentsTable)
      .innerJoin(doctorsTable, eq(appointmentsTable.doctorId, doctorsTable.id))
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, periodStart),
          lt(appointmentsTable.date, periodEnd),
        ),
      )
      .groupBy(doctorsTable.specialty)
      .orderBy(desc(count(appointmentsTable.id))),
    db.query.appointmentsTable.findMany({
      where: and(
        eq(appointmentsTable.clinicId, session.user.clinic.id),
        gte(appointmentsTable.date, today.start),
        lt(appointmentsTable.date, today.end),
      ),
      with: {
        patient: { columns: PATIENT_OPTION_COLUMNS },
        doctor: true,
      },
    }),
    db
      .select({ id: patientsTable.id, name: patientsTable.name })
      .from(patientsTable)
      .where(eq(patientsTable.clinicId, session.user.clinic.id)),
    db
      .select()
      .from(doctorsTable)
      .where(eq(doctorsTable.clinicId, session.user.clinic.id)),
    db
      .select({
        date: sql<string>`${appointmentClinicDay}`.as("date"),
        appointments: count(appointmentsTable.id),
        revenue:
          sql<number>`COALESCE(SUM(${appointmentsTable.appointmentPriceInCents}), 0)`.as(
            "revenue",
          ),
      })
      .from(appointmentsTable)
      .where(
        and(
          eq(appointmentsTable.clinicId, session.user.clinic.id),
          gte(appointmentsTable.date, chartStartDate),
          lt(appointmentsTable.date, chartEndDate),
        ),
      )
      .groupBy(appointmentClinicDay)
      .orderBy(appointmentClinicDay),
  ]);

  return {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topSpecialties,
    todayAppointments,
    allPatients,
    allDoctors,
    dailyAppointmentsData,
  };
};
