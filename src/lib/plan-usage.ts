import { and, eq, gte, lt } from "drizzle-orm";

import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { clinicMonthRange, clinicToday } from "@/helpers/time";
import type { PlanUsage } from "@/lib/plan-usage-types";
import { resolvePlan } from "@/lib/plans";

// Counts the same way the server actions enforce the limits.
// clinicCount is per account (the session already has it); the other limits
// are per clinic.
export const getPlanUsage = async (
  clinicId: string,
  plan: string | null | undefined,
  clinicCount: number,
): Promise<PlanUsage> => {
  const { limits } = resolvePlan(plan);
  const month = clinicMonthRange(clinicToday());
  const [doctors, patients, appointmentsThisMonth] = await Promise.all([
    db.$count(doctorsTable, eq(doctorsTable.clinicId, clinicId)),
    db.$count(patientsTable, eq(patientsTable.clinicId, clinicId)),
    db.$count(
      appointmentsTable,
      and(
        eq(appointmentsTable.clinicId, clinicId),
        gte(appointmentsTable.date, month.start),
        lt(appointmentsTable.date, month.end),
      ),
    ),
  ]);
  return {
    clinics: { used: clinicCount, limit: limits.clinics },
    doctors: { used: doctors, limit: limits.doctors },
    patients: { used: patients, limit: limits.patients },
    appointmentsPerMonth: {
      used: appointmentsThisMonth,
      limit: limits.appointmentsPerMonth,
    },
  };
};
