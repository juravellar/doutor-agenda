import type { LucideIcon } from "lucide-react";

import { CardHeader, CardTitle } from "@/components/ui/card";

// The same header on every dashboard card, so icons and titles line up.
export function DashboardCardHeader({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <CardHeader className="flex flex-row items-center gap-2">
      <Icon className="text-primary h-4 w-4 shrink-0" aria-hidden />
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
  );
}
