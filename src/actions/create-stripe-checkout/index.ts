"use server";

import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { UserFacingError } from "@/lib/action-errors";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { isPaidPlan, type PaidPlanId } from "@/lib/plans";
import { priceIdForPlan } from "@/lib/stripe-plan";
import {
  listCustomerSubscriptions,
  retrieveIfExists,
} from "@/lib/stripe-subscription-sync";

const ALREADY_SUBSCRIBED_MESSAGE =
  "Você já tem uma assinatura. Use Gerenciar assinatura para trocar de plano.";

// Any subscription that can still bill the customer, including ones waiting
// on payment, must be managed in the portal rather than duplicated.
const LIVE_STATUSES = new Set<Stripe.Subscription.Status>([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);
const isLive = (subscription: Stripe.Subscription) =>
  LIVE_STATUSES.has(subscription.status);

// Stripe rejects an idempotency key reused with different parameters, so the
// parameters are part of the key.
const idempotencyKey = (scope: string, ...parts: string[]) =>
  `${scope}:${createHash("sha256").update(parts.join("|")).digest("hex")}`;

type User = typeof usersTable.$inferSelect;

const ensureCustomer = async (stripe: Stripe, user: User) => {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }
  const customer = await stripe.customers.create(
    { email: user.email, name: user.name, metadata: { userId: user.id } },
    {
      idempotencyKey: idempotencyKey(
        "customer",
        user.id,
        user.email,
        user.name,
      ),
    },
  );
  await db
    .update(usersTable)
    .set({ stripeCustomerId: customer.id })
    .where(
      and(eq(usersTable.id, user.id), isNull(usersTable.stripeCustomerId)),
    );
  // A concurrent request may have saved its customer first; use that one.
  const saved = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, user.id),
  });
  return saved?.stripeCustomerId ?? customer.id;
};

const hasLiveSubscription = async (
  stripe: Stripe,
  user: User,
  customerId: string,
) => {
  const subscriptions = await listCustomerSubscriptions(stripe, customerId);
  if (subscriptions.some(isLive)) {
    return true;
  }
  // The current subscription may belong to an older customer of the user.
  const currentId = user.stripeSubscriptionId;
  if (currentId && !subscriptions.some(({ id }) => id === currentId)) {
    const current = await retrieveIfExists(stripe, currentId);
    return current ? isLive(current) : false;
  }
  return false;
};

/**
 * Returns the open checkout for this plan if there is one, after expiring
 * open checkouts for other plans. Throws if any of those stays open, since two
 * payable checkouts could create two subscriptions.
 */
const resolveOpenCheckouts = async (
  stripe: Stripe,
  customerId: string,
  plan: PaidPlanId,
) => {
  const listOpen = () =>
    stripe.checkout.sessions
      .list({ customer: customerId, status: "open", limit: 100 })
      .autoPagingToArray({ limit: 1_000 });

  const open = await listOpen();
  const reusable = open.find((session) => session.metadata?.plan === plan);
  const others = open.filter((session) => session !== reusable);
  await Promise.allSettled(
    others.map((session) => stripe.checkout.sessions.expire(session.id)),
  );
  if (others.length > 0) {
    const stillOpen = await listOpen();
    if (stillOpen.some(({ id }) => others.some((other) => other.id === id))) {
      throw new Error("A previous checkout session could not be expired");
    }
  }
  return { reusable: reusable ?? null, openIds: open.map(({ id }) => id) };
};

// The browser goes straight to the hosted checkout page, so Stripe.js never
// loads in the app (once loaded, it reports every page change to Stripe).
const checkoutUrl = (checkout: Stripe.Checkout.Session) => {
  if (!checkout.url) {
    throw new Error(`Checkout session ${checkout.id} has no url`);
  }
  return checkout.url;
};

export const createStripeCheckout = actionClient
  .schema(z.object({ plan: z.enum(["essential", "professional"]) }))
  .action(async ({ parsedInput }) => {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Stripe secret key not found");
    }
    const priceId = priceIdForPlan(parsedInput.plan);
    if (!priceId) {
      throw new Error(`Stripe price not configured for ${parsedInput.plan}`);
    }
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, session.user.id),
    });
    if (!user) {
      throw new Error("Unauthorized");
    }
    if (user.stripeSubscriptionId && isPaidPlan(user.plan)) {
      throw new UserFacingError(ALREADY_SUBSCRIBED_MESSAGE);
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
    const customerId = await ensureCustomer(stripe, user);

    // Stripe, not the database, is the source of truth here: the database
    // only learns about a paid checkout when its webhook arrives.
    if (await hasLiveSubscription(stripe, user, customerId)) {
      throw new UserFacingError(ALREADY_SUBSCRIBED_MESSAGE);
    }

    const { reusable, openIds } = await resolveOpenCheckouts(
      stripe,
      customerId,
      parsedInput.plan,
    );
    if (reusable) {
      return { url: checkoutUrl(reusable) };
    }

    // Requests within the same minute that saw the same open checkouts (a
    // double click, two tabs) get the same session back instead of two
    // payable ones. The open checkouts are part of the key so that returning
    // to a plan whose checkout was just expired creates a fresh session
    // instead of Stripe replaying the expired one.
    const minute = Math.floor(Date.now() / 60_000).toString();
    const checkout = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?assinatura=confirmada`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
        metadata: { plan: parsedInput.plan },
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
      },
      {
        idempotencyKey: idempotencyKey(
          "checkout",
          customerId,
          priceId,
          minute,
          ...[...openIds].sort(),
        ),
      },
    );
    return { url: checkoutUrl(checkout) };
  });
