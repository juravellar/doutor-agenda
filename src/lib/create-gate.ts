import { CLINIC_READ_ONLY_MESSAGE } from "@/lib/free-period";
import { isAtLimit, type Usage } from "@/lib/plan-usage-types";

// Why creating is blocked, which decides how the app explains it and where it
// sends the user: plans for a limit or an ended free period, the clinic list
// for a clinic that is read-only on the current plan.
export type BlockedKind = "limit" | "free-period-over" | "read-only";

export interface CreateGate {
  // e.g. "12 de 20 pacientes"; null when the plan has no limit.
  usageText: string | null;
  // Why creating is not possible right now; null when it is.
  blockedReason: string | null;
  blockedKind: BlockedKind | null;
}

export const LIMIT_REACHED_MESSAGE = "Você atingiu o limite do seu plano.";

export const createGate = (
  usage: Usage,
  // Why writing is blocked for the whole clinic (e.g. free period over).
  blockReason: string | null,
  noun: { one: string; many: string },
  period = "",
): CreateGate => {
  const usageText =
    usage.limit === null
      ? null
      : `${usage.used} de ${usage.limit} ${usage.limit === 1 ? noun.one : noun.many}${period}`;
  if (blockReason) {
    return {
      usageText,
      blockedReason: blockReason,
      blockedKind:
        blockReason === CLINIC_READ_ONLY_MESSAGE
          ? "read-only"
          : "free-period-over",
    };
  }
  if (isAtLimit(usage)) {
    return {
      usageText,
      blockedReason: LIMIT_REACHED_MESSAGE,
      blockedKind: "limit",
    };
  }
  return { usageText, blockedReason: null, blockedKind: null };
};
