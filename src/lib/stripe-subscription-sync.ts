import { eq } from "drizzle-orm";
import type Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import type { PaidPlanId } from "@/lib/plans";
import { planForPriceId } from "@/lib/stripe-plan";

// past_due keeps access while Stripe retries the payment; unpaid, paused,
// incomplete and canceled subscriptions fall back to Free.
const STATUSES_WITH_ACCESS = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
]);

export const planForSubscription = (
  subscription: Stripe.Subscription,
): PaidPlanId | null => {
  if (!STATUSES_WITH_ACCESS.has(subscription.status)) {
    return null;
  }
  // Subscriptions created before plans existed only had the Essencial price.
  return planForPriceId(subscription.items.data[0]?.price.id) ?? "essential";
};

const customerIdOf = (subscription: Stripe.Subscription) =>
  typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id;

const findUserFor = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.userId;
  if (userId) {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, userId),
    });
    if (user) {
      return user;
    }
  }
  return db.query.usersTable.findFirst({
    where: eq(usersTable.stripeCustomerId, customerIdOf(subscription)),
  });
};

/**
 * Brings the user's plan in line with the subscription as Stripe has it now.
 *
 * Webhook events can arrive late, retried or out of order, so the event
 * payload is never trusted: the subscription is always fetched again. Events
 * about a subscription that is no longer the user's current one are ignored
 * unless that subscription is the one granting access.
 */
export const syncSubscription = async (
  stripe: Stripe,
  subscriptionId: string,
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const user = await findUserFor(subscription);
  if (!user) {
    throw new Error(`No user found for subscription ${subscription.id}`);
  }

  const plan = planForSubscription(subscription);
  const isCurrentSubscription =
    !user.stripeSubscriptionId || user.stripeSubscriptionId === subscription.id;
  if (!isCurrentSubscription && !plan) {
    return;
  }

  await db
    .update(usersTable)
    .set({
      plan,
      stripeSubscriptionId: plan ? subscription.id : null,
      stripeCustomerId: customerIdOf(subscription),
    })
    .where(eq(usersTable.id, user.id));
};
