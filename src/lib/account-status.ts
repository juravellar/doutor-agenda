import { freePeriodDaysLeft, isReadOnly } from "@/lib/free-period";
import { isPaidPlan, resolvePlan } from "@/lib/plans";

// Remaining free days are only highlighted near the end, to avoid nagging.
const WARNING_DAYS = 14;

export type AccountStatus =
  | { kind: "payment-failed"; planName: string }
  | { kind: "subscription-ending"; planName: string; endsAt: Date }
  | { kind: "free-period-over" }
  | { kind: "free-period-ending"; daysLeft: number }
  | null;

// The most urgent thing the user should know about their plan, if any.
export const accountStatus = (
  user: {
    plan?: string | null;
    subscriptionStatus?: string | null;
    subscriptionEndsAt?: Date | string | null;
    freePeriodStartsAt?: Date | string | null;
    clinic?: object | null;
  },
  now: Date = new Date(),
): AccountStatus => {
  if (!user.clinic) {
    return null;
  }
  if (isPaidPlan(user.plan)) {
    const planName = resolvePlan(user.plan).name;
    if (user.subscriptionStatus === "past_due") {
      return { kind: "payment-failed", planName };
    }
    if (user.subscriptionEndsAt) {
      return {
        kind: "subscription-ending",
        planName,
        endsAt: new Date(user.subscriptionEndsAt),
      };
    }
    return null;
  }
  const freePeriodStartsAt = user.freePeriodStartsAt ?? undefined;
  if (isReadOnly(user.plan, freePeriodStartsAt, now)) {
    return { kind: "free-period-over" };
  }
  const daysLeft = freePeriodDaysLeft(freePeriodStartsAt, now);
  return daysLeft <= WARNING_DAYS
    ? { kind: "free-period-ending", daysLeft }
    : null;
};
