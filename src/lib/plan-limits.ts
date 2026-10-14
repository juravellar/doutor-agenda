import { UserFacingError } from "@/lib/action-errors";
import { isReadOnly } from "@/lib/free-period";
import type { Plan, PlanLimits } from "@/lib/plans";

export class PlanLimitError extends UserFacingError {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

const LIMIT_MESSAGES: Record<keyof PlanLimits, (limit: number) => string> = {
  clinics: (limit) =>
    `Seu plano permite até ${limit} ${limit === 1 ? "clínica" : "clínicas"}.`,
  doctors: (limit) =>
    `Seu plano permite até ${limit} ${limit === 1 ? "médico" : "médicos"}.`,
  patients: (limit) => `Seu plano permite até ${limit} pacientes.`,
  appointmentsPerMonth: (limit) =>
    `Seu plano permite até ${limit} agendamentos por mês.`,
};

export const ensurePlanAllows = (
  plan: Plan,
  resource: keyof PlanLimits,
  used: number,
) => {
  const limit = plan.limits[resource];
  if (limit !== null && used >= limit) {
    throw new PlanLimitError(
      `${LIMIT_MESSAGES[resource](limit)} Faça upgrade em Assinatura para continuar.`,
    );
  }
};

export const ensureCanEdit = (
  plan: string | null | undefined,
  clinicCreatedAt: Date | string | undefined,
) => {
  if (isReadOnly(plan, clinicCreatedAt)) {
    throw new PlanLimitError(
      "Seu período gratuito de 3 meses terminou. Assine um plano para voltar a cadastrar e editar.",
    );
  }
};
