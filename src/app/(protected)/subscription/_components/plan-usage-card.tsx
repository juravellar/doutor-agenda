import {
  CalendarDays,
  type LucideIcon,
  Stethoscope,
  UsersRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlanUsage, Usage } from "@/lib/plan-usage-types";
import { isAtLimit } from "@/lib/plan-usage-types";
import { cn } from "@/lib/utils";

interface Metric {
  key: keyof PlanUsage;
  label: string;
  icon: LucideIcon;
  note?: string;
}

const METRICS: Metric[] = [
  { key: "doctors", label: "Médicos", icon: Stethoscope },
  { key: "patients", label: "Pacientes", icon: UsersRound },
  {
    key: "appointmentsPerMonth",
    label: "Agendamentos este mês",
    icon: CalendarDays,
    note: "A contagem recomeça no dia 1º.",
  },
];

const statusText = ({ used, limit }: Usage, planName: string) => {
  if (limit === null) {
    return `Sem limite no plano ${planName}`;
  }
  const remaining = limit - used;
  if (remaining <= 0) {
    return "Limite atingido";
  }
  return remaining === 1 ? "Resta 1" : `Restam ${remaining}`;
};

function UsageTile({
  metric,
  usage,
  planName,
}: {
  metric: Metric;
  usage: Usage;
  planName: string;
}) {
  const atLimit = isAtLimit(usage);
  const Icon = metric.icon;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-4",
        atLimit ? "border-amber-300 bg-amber-50" : "bg-gray-50/60",
      )}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon className="h-4 w-4 text-gray-500" aria-hidden />
        {metric.label}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold text-gray-900">
          {usage.used}
        </span>
        {usage.limit !== null && (
          <span className="text-base text-gray-500">de {usage.limit}</span>
        )}
      </div>

      {usage.limit !== null && (
        <Progress
          value={Math.min(100, (usage.used / usage.limit) * 100)}
          aria-label={`${metric.label}: ${usage.used} de ${usage.limit}`}
          className={cn(
            atLimit && "[&>[data-slot=progress-indicator]]:bg-amber-500",
          )}
        />
      )}

      <div className="space-y-0.5">
        <p
          className={cn(
            "text-sm",
            atLimit ? "font-medium text-amber-800" : "text-gray-600",
          )}
        >
          {statusText(usage, planName)}
        </p>
        {metric.note && <p className="text-xs text-gray-500">{metric.note}</p>}
      </div>
    </div>
  );
}

export function PlanUsageCard({
  planName,
  usage,
}: {
  planName: string;
  usage: PlanUsage;
}) {
  const anyAtLimit = METRICS.some(({ key }) => isAtLimit(usage[key]));
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Seu uso no plano {planName}</CardTitle>
        <p className="text-sm text-gray-600">
          Cadastros da sua clínica e o que o seu plano permite.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          {METRICS.map((metric) => (
            <UsageTile
              key={metric.key}
              metric={metric}
              usage={usage[metric.key]}
              planName={planName}
            />
          ))}
        </div>
        {anyAtLimit && (
          <p className="text-sm text-amber-800">
            Você atingiu um limite do seu plano. Para continuar cadastrando,
            escolha um plano maior abaixo.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
