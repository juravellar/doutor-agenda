"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { UserFacingError } from "@/lib/action-errors";
import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
import { isPaidPlan } from "@/lib/plans";
import { priceIdForPlan } from "@/lib/stripe-plan";

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
      throw new UserFacingError(
        "Você já tem uma assinatura. Use Gerenciar assinatura para trocar de plano.",
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });

    // One Stripe customer per user, so every checkout and subscription of the
    // user can be found and deduplicated.
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, user.id));
    }

    // A double click or a second tab must not leave two checkouts that could
    // both be paid, creating two subscriptions.
    const openSessions = await stripe.checkout.sessions.list({
      customer: customerId,
      status: "open",
      limit: 10,
    });
    await Promise.all(
      openSessions.data.map((openSession) =>
        stripe.checkout.sessions.expire(openSession.id),
      ),
    );

    const { id: sessionId } = await stripe.checkout.sessions.create({
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
    return {
      sessionId,
    };
  });
