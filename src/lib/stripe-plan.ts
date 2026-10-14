import { unstable_cache } from "next/cache";
import Stripe from "stripe";

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

// The checkout charges this Stripe price, so the page must show the same one.
export const getEssentialPlanPrice = unstable_cache(
  async (): Promise<PlanPrice | null> => {
    const { STRIPE_SECRET_KEY, STRIPE_ESSENTIAL_PLAN_PRICE_ID } = process.env;
    if (!STRIPE_SECRET_KEY || !STRIPE_ESSENTIAL_PLAN_PRICE_ID) {
      return null;
    }
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, {
        apiVersion: "2025-05-28.basil",
      });
      const price = await stripe.prices.retrieve(
        STRIPE_ESSENTIAL_PLAN_PRICE_ID,
      );
      return formatPlanPrice(price);
    } catch (error) {
      console.error("Failed to load the Stripe plan price", error);
      return null;
    }
  },
  ["essential-plan-price"],
  { revalidate: 3600 },
);
