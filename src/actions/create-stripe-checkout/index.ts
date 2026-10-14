"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { withUserLock } from "@/db/clinic-lock";
import { usersTable } from "@/db/schema";
import { UserFacingError } from "@/lib/action-errors";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { priceIdForPlan } from "@/lib/stripe-plan";
import { planForSubscription } from "@/lib/stripe-subscription-sync";

const ALREADY_SUBSCRIBED_MESSAGE =
  "Você já tem uma assinatura. Use Gerenciar assinatura para trocar de plano.";

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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });

    // Serialized per user: with a double click or a second tab, the later
    // request sees the customer and open checkout the earlier one created.
    const sessionId = await withUserLock(session.user.id, async (tx) => {
      const user = await tx.query.usersTable.findFirst({
        where: eq(usersTable.id, session.user.id),
      });
      if (!user) {
        throw new Error("Unauthorized");
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create(
          { email: user.email, name: user.name, metadata: { userId: user.id } },
          { idempotencyKey: `customer-for-user-${user.id}` },
        );
        customerId = customer.id;
        await tx
          .update(usersTable)
          .set({ stripeCustomerId: customerId })
          .where(eq(usersTable.id, user.id));
      }

      // Stripe, not the database, is the source of truth here: the database
      // only learns about a paid checkout when its webhook arrives.
      const { data: subscriptions } = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 100,
      });
      if (subscriptions.some(planForSubscription)) {
        throw new UserFacingError(ALREADY_SUBSCRIBED_MESSAGE);
      }

      const openSessions = await stripe.checkout.sessions.list({
        customer: customerId,
        status: "open",
        limit: 10,
      });
      // A session completed or expired since it was listed can't be expired
      // anymore; that must not block starting a new checkout.
      await Promise.allSettled(
        openSessions.data.map((openSession) =>
          stripe.checkout.sessions.expire(openSession.id),
        ),
      );

      const checkout = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer: customerId,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
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
      });
      return checkout.id;
    });

    return {
      sessionId,
    };
  });
