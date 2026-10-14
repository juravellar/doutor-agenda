import { resolvePlan } from "@/lib/plans";

export interface Membership {
  clinicId: string;
  name: string;
  clinicCreatedAt: Date;
  memberSince: Date;
  keptInPlan: boolean;
}

export interface ClinicAccess {
  id: string;
  name: string;
  createdAt: Date;
  // False when the clinic is beyond the plan's clinic limit: read-only.
  writable: boolean;
}

/**
 * Decides which of the user's clinics can be used and which one is active.
 *
 * Up to the plan's clinic limit are usable: the ones the user chose to keep,
 * then the oldest. The active clinic must be one of the user's own; anything
 * else falls back to the first usable clinic.
 */
export const resolveClinicAccess = (
  memberships: Membership[],
  activeClinicId: string | null | undefined,
  plan: string | null | undefined,
) => {
  const limit = resolvePlan(plan).limits.clinics;
  const byAge = [...memberships].sort(
    (a, b) => a.memberSince.getTime() - b.memberSince.getTime(),
  );
  const byPriority = [...byAge].sort(
    (a, b) => Number(b.keptInPlan) - Number(a.keptInPlan),
  );
  const usable = new Set(
    (limit === null ? byPriority : byPriority.slice(0, limit)).map(
      ({ clinicId }) => clinicId,
    ),
  );

  const clinics: ClinicAccess[] = byAge.map((membership) => ({
    id: membership.clinicId,
    name: membership.name,
    createdAt: membership.clinicCreatedAt,
    writable: usable.has(membership.clinicId),
  }));
  const active =
    clinics.find(({ id }) => id === activeClinicId) ??
    clinics.find(({ writable }) => writable) ??
    clinics[0] ??
    null;
  const freePeriodStartsAt = byAge.length
    ? new Date(
        Math.min(
          ...byAge.map(({ clinicCreatedAt }) => clinicCreatedAt.getTime()),
        ),
      )
    : null;

  return {
    active,
    clinics,
    clinicLimit: limit,
    overClinicLimit: limit !== null && memberships.length > limit,
    // The free period belongs to the account, not to each clinic, so a new
    // clinic never restarts it.
    freePeriodStartsAt,
  };
};

export const CLINIC_CHOICE_COOLDOWN_DAYS = 30;

/**
 * Whether the user may (re)choose which clinics stay usable. The first choice
 * is free; after that one change per 30 days, enough to fix a mistake but not
 * to rotate clinics and use more than the plan pays for.
 */
export const clinicChoiceStatus = (
  madeAt: Date | string | null | undefined,
  changedAt: Date | string | null | undefined,
  now: Date = new Date(),
) => {
  if (!madeAt || !changedAt) {
    return { allowed: true, nextChangeAt: null };
  }
  const nextChangeAt = new Date(
    new Date(changedAt).getTime() +
      CLINIC_CHOICE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
  );
  return now >= nextChangeAt
    ? { allowed: true, nextChangeAt: null }
    : { allowed: false, nextChangeAt };
};
