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

const retrieveOrNull = async (stripe: Stripe, subscriptionId: string) => {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch {
    return null;
  }
};

/**
 * Picks the subscription that should define the user's plan: the current one
 * while it still grants access, otherwise the newest one that does.
 */
const chooseSubscription = (
  subscriptions: Stripe.Subscription[],
  currentSubscriptionId: string | null,
) => {
  const withAccess = subscriptions.filter((subscription) =>
    planForSubscription(subscription),
  );
  return (
    withAccess.find(({ id }) => id === currentSubscriptionId) ??
    withAccess.sort((a, b) => b.created - a.created)[0] ??
    null
  );
};

/**
 * Brings the user's plan in line with their subscriptions as Stripe has them
 * now.
 *
 * Webhook events can arrive late, retried or out of order, so the event only
 * says which customer to look at: every subscription of that customer is read
 * again, plus the user's current one. Canceling a duplicate therefore never
 * drops a user who still has another subscription granting access.
 */
export const syncSubscription = async (
  stripe: Stripe,
  subscriptionId: string,
) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const user = await findUserFor(subscription);
  if (!user) {
    // Subscriptions created outside the app on the same Stripe account are
    // acknowledged, so Stripe does not keep retrying and disable the endpoint.
    console.warn(`Ignoring subscription ${subscription.id}: no matching user`);
    return;
  }

  const customerId = customerIdOf(subscription);
  const { data: customerSubscriptions } = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  });
  const candidates = [...customerSubscriptions];
  const currentId = user.stripeSubscriptionId;
  if (currentId && !candidates.some(({ id }) => id === currentId)) {
    const current = await retrieveOrNull(stripe, currentId);
    if (current) {
      candidates.push(current);
    }
  }

  const chosen = chooseSubscription(candidates, currentId);
  await db
    .update(usersTable)
    .set({
      plan: chosen ? planForSubscription(chosen) : null,
      stripeSubscriptionId: chosen?.id ?? null,
      stripeCustomerId: chosen ? customerIdOf(chosen) : customerId,
    })
    .where(eq(usersTable.id, user.id));
};
