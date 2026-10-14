import { isAtLimit, type Usage } from "@/lib/plan-usage-types";

export interface CreateGate {
  // e.g. "12 de 20 pacientes"; null when the plan has no limit.
  usageText: string | null;
  // Why creating is not possible right now; null when it is.
  blockedReason: string | null;
}

export const createGate = (
  usage: Usage,
  readOnly: boolean,
  noun: { one: string; many: string },
  period = "",
): CreateGate => ({
  usageText:
    usage.limit === null
      ? null
      : `${usage.used} de ${usage.limit} ${usage.limit === 1 ? noun.one : noun.many}${period}`,
  blockedReason: readOnly
    ? "Seu período gratuito terminou."
    : isAtLimit(usage)
      ? "Você atingiu o limite do seu plano."
      : null,
});
