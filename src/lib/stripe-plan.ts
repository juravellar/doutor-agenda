import { unstable_cache } from "next/cache";
import Stripe from "stripe";

import { PAID_PLAN_IDS, type PaidPlanId } from "@/lib/plans";

const INTERVAL_LABELS: Record<Stripe.Price.Recurring.Interval, string> = {
  day: "dia",
  week: "semana",
  month: "mês",
  year: "ano",
};

export interface PlanPrice {
  amount: string;
  interval: string | null;
}

export const formatPlanPrice = (price: Stripe.Price): PlanPrice | null => {
  if (price.unit_amount === null) {
    return null;
  }
  const amount = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: price.currency.toUpperCase(),
    minimumFractionDigits: price.unit_amount % 100 === 0 ? 0 : 2,
  }).format(price.unit_amount / 100);
  const interval = price.recurring
    ? INTERVAL_LABELS[price.recurring.interval]
    : null;
  return { amount, interval };
};

export const priceIdForPlan = (plan: PaidPlanId) =>
  plan === "essential"
    ? process.env.STRIPE_ESSENTIAL_PLAN_PRICE_ID
    : process.env.STRIPE_PROFESSIONAL_PLAN_PRICE_ID;

export const planForPriceId = (
  priceId: string | null | undefined,
): PaidPlanId | null =>
  PAID_PLAN_IDS.find((plan) => priceId && priceIdForPlan(plan) === priceId) ??
  null;

const loadPlanPrice = async (plan: PaidPlanId): Promise<PlanPrice | null> => {
  const priceId = priceIdForPlan(plan);
  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return null;
  }
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
    return formatPlanPrice(await stripe.prices.retrieve(priceId));
  } catch (error) {
    console.error(`Failed to load the Stripe price of plan ${plan}`, error);
    return null;
  }
};

// Checkout charges these Stripe prices, so the plan cards must show the same.
export const getPlanPrices = unstable_cache(
  async (): Promise<Record<PaidPlanId, PlanPrice | null>> => {
    const [essential, professional] = await Promise.all(
      PAID_PLAN_IDS.map(loadPlanPrice),
    );
    return { essential, professional };
  },
  ["plan-prices"],
  { revalidate: 3600 },
);
