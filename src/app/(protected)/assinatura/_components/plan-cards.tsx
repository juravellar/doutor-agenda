"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import {
  type BillingInterval,
  type PlanPrice,
  yearlySavingsPercent,
} from "@/lib/plan-price";
import { PAID_PLAN_IDS, type PaidPlanId,type Plan, type PlanId } from "@/lib/plans";
import { cn } from "@/lib/utils";

import { PlanCard } from "./plan-card";

type Prices = Record<PaidPlanId, Record<BillingInterval, PlanPrice | null>>;

// The plan cards with a monthly/yearly switch, shown only when at least one
// plan has a yearly price in Stripe.
export function PlanCards({
  plans,
  prices,
  currentPlanId,
  userEmail,
  subscriptionNotice,
}: {
  plans: Plan[];
  prices: Prices;
  currentPlanId: PlanId;
  userEmail: string;
  subscriptionNotice: { endsOn: string | null; pastDue: boolean };
}) {
  const [interval, setBillingInterval] = useState<BillingInterval>("monthly");
  const savings = PAID_PLAN_IDS.map((plan) =>
    yearlySavingsPercent(prices[plan].monthly, prices[plan].yearly),
  ).filter((value): value is number => value !== null);
  const offersYearly = PAID_PLAN_IDS.some((plan) => prices[plan].yearly);
  const bestSaving = savings.length ? Math.max(...savings) : null;

  return (
    <div className="space-y-6">
      {offersYearly && (
        <div className="flex justify-center">
          <div
            role="radiogroup"
            aria-label="Forma de pagamento"
            className="bg-muted inline-flex rounded-lg p-1"
          >
            {(
              [
                ["monthly", "Mensal"],
                ["yearly", "Anual"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={interval === value}
                onClick={() => setBillingInterval(value)}
                className={cn(
                  "rounded-md px-4 py-1.5 text-sm font-medium transition-[color,background-color,box-shadow] duration-150",
                  interval === value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
                {value === "yearly" && bestSaving ? (
                  <span className="text-success-foreground ml-1.5 text-xs">
                    −{bestSaving}%
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid w-full gap-6 pt-3 @4xl:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            prices={plan.id === "free" ? null : prices[plan.id]}
            interval={interval}
            recommended={plan.id === "essential"}
            currentPlanId={currentPlanId}
            userEmail={userEmail}
            subscriptionNotice={subscriptionNotice}
          />
        ))}
      </div>
      <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
        <Lock className="h-3.5 w-3.5" aria-hidden />
        Pagamento seguro pelo Stripe. Cancele quando quiser.
      </p>
    </div>
  );
}
