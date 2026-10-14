import dayjs from "dayjs";

import { isPaidPlan } from "@/lib/plans";

export const FREE_PERIOD_MONTHS = 3;

// Clinics created before the free period existed get the full period counted
// from its launch instead of losing write access on the day it shipped.
export const FREE_PERIOD_LAUNCH = new Date("2026-10-15T03:00:00.000Z");

export const freePeriodEndsAt = (
  clinicCreatedAt: Date | string | undefined,
) => {
  const createdAt = dayjs(clinicCreatedAt);
  const start = createdAt.isBefore(FREE_PERIOD_LAUNCH)
    ? dayjs(FREE_PERIOD_LAUNCH)
    : createdAt;
  return start.add(FREE_PERIOD_MONTHS, "month").toDate();
};

// Free clinics past their period can still see their data but not change it.
export const isReadOnly = (
  plan: string | null | undefined,
  clinicCreatedAt: Date | string | undefined,
  now: Date = new Date(),
) => !isPaidPlan(plan) && now >= freePeriodEndsAt(clinicCreatedAt);

export const freePeriodDaysLeft = (
  clinicCreatedAt: Date | string | undefined,
  now: Date = new Date(),
) => Math.max(0, dayjs(freePeriodEndsAt(clinicCreatedAt)).diff(now, "day"));
