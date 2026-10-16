import { formatCurrencyInCents } from "@/helpers/currency";

// Price shapes and arithmetic with no server dependency, so client
// components (the plan cards) can use them without bundling the Stripe SDK.
export interface PlanPrice {
  amount: string;
  interval: string | null;
  // For comparing billing periods: what it costs and how many months it buys.
  cents: number;
  months: number;
}

export type BillingInterval = "monthly" | "yearly";
export const BILLING_INTERVALS: readonly BillingInterval[] = [
  "monthly",
  "yearly",
];

// How much cheaper the yearly price is than twelve monthly ones, in whole
// percent; null when there is nothing to compare or no saving.
export const yearlySavingsPercent = (
  monthly: PlanPrice | null,
  yearly: PlanPrice | null,
) => {
  if (!monthly || !yearly || monthly.months !== 1) {
    return null;
  }
  const fullPrice = (monthly.cents * yearly.months) / monthly.months;
  const percent = Math.round((1 - yearly.cents / fullPrice) * 100);
  return percent > 0 ? percent : null;
};

export const monthlyEquivalent = (price: PlanPrice) =>
  formatCurrencyInCents(price.cents / price.months);
