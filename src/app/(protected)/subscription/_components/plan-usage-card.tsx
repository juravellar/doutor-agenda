import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { PlanUsage, Usage } from "@/lib/plan-usage-types";
import { isAtLimit } from "@/lib/plan-usage-types";
import { cn } from "@/lib/utils";

const ROWS: { key: keyof PlanUsage; label: string }[] = [
  { key: "doctors", label: "Médicos" },
  { key: "patients", label: "Pacientes" },
  { key: "appointmentsPerMonth", label: "Agendamentos neste mês" },
];

function UsageRow({ label, usage }: { label: string; usage: Usage }) {
  const atLimit = isAtLimit(usage);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span
          className={cn(
            "font-medium",
            atLimit ? "text-amber-700" : "text-gray-900",
          )}
        >
          {usage.limit === null
            ? `${usage.used} · ilimitado`
            : `${usage.used} de ${usage.limit}`}
        </span>
      </div>
      {usage.limit !== null && (
        <Progress
          value={Math.min(100, (usage.used / usage.limit) * 100)}
          aria-label={`${label}: ${usage.used} de ${usage.limit}`}
          className={cn(
            atLimit && "[&>[data-slot=progress-indicator]]:bg-amber-500",
          )}
        />
      )}
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
  const anyAtLimit = ROWS.some(({ key }) => isAtLimit(usage[key]));
  return (
    <Card className="w-full max-w-5xl">
      <CardHeader>
        <CardTitle>Uso do plano {planName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 md:grid-cols-3">
          {ROWS.map(({ key, label }) => (
            <UsageRow key={key} label={label} usage={usage[key]} />
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
