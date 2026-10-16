import Link from "next/link";

import type { CreateGate } from "@/lib/create-gate";
import { cn } from "@/lib/utils";

export function CreateGateHint({ gate }: { gate: CreateGate }) {
  if (!gate.usageText && !gate.blockedReason) {
    return null;
  }
  return (
    <p
      className={cn(
        "text-right text-xs",
        gate.blockedReason ? "text-warning-foreground" : "text-muted-foreground",
      )}
    >
      {gate.blockedReason ? `${gate.blockedReason} ` : null}
      {gate.usageText}
      {gate.blockedReason ? (
        <>
          {" · "}
          <Link href="/assinatura" className="font-medium underline">
            Ver planos
          </Link>
        </>
      ) : null}
    </p>
  );
}
