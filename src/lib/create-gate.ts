import type { WriteBlock } from "@/lib/free-period";
import { isAtLimit, type Usage } from "@/lib/plan-usage-types";

// Why creating is blocked, which decides how the app explains it and where it
// sends the user: plans for a limit or an ended free period, the clinic list
// for a clinic that is read-only on the current plan.
export type BlockedKind = "limit" | WriteBlock["kind"];

// Shared by the dialog and the hint under the button, so both send the user
// to the same place.
export const BLOCKED_COPY: Record<
  BlockedKind,
  { title: string; next: string; href: string; action: string }
> = {
  limit: {
    title: "Limite do plano atingido",
    next: "Para cadastrar mais, escolha um plano maior.",
    href: "/subscription",
    action: "Ver planos",
  },
  "free-period-over": {
    title: "Período gratuito encerrado",
    next: "Seus dados continuam disponíveis. Para voltar a cadastrar e editar, assine um plano.",
    href: "/subscription",
    action: "Ver planos",
  },
  "read-only": {
    title: "Clínica só leitura",
    next: "Escolha quais clínicas ficam ativas no seu plano ou faça upgrade.",
    href: "/clinics",
    action: "Minhas clínicas",
  },
};

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
  block: WriteBlock | null,
  noun: { one: string; many: string },
  period = "",
): CreateGate => {
  const usageText =
    usage.limit === null
      ? null
      : `${usage.used} de ${usage.limit} ${usage.limit === 1 ? noun.one : noun.many}${period}`;
  if (block) {
    return { usageText, blockedReason: block.message, blockedKind: block.kind };
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
