import type { Plan, PlanLimits } from "@/lib/plans";

// Its message is shown to the user; other server errors stay generic.
export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

const LIMIT_MESSAGES: Record<keyof PlanLimits, (limit: number) => string> = {
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
