import { isAtLimit, type Usage } from "@/lib/plan-usage-types";

export interface CreateGate {
  // e.g. "12 de 20 pacientes"; null when the plan has no limit.
  usageText: string | null;
  // Why creating is not possible right now; null when it is.
  blockedReason: string | null;
}

export const createGate = (
  usage: Usage,
  // Why writing is blocked for the whole clinic (e.g. free period over).
  blockReason: string | null,
  noun: { one: string; many: string },
  period = "",
): CreateGate => ({
  usageText:
    usage.limit === null
      ? null
      : `${usage.used} de ${usage.limit} ${usage.limit === 1 ? noun.one : noun.many}${period}`,
  blockedReason: blockReason
    ? blockReason
    : isAtLimit(usage)
      ? "Você atingiu o limite do seu plano."
      : null,
});
