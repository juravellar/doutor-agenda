"use server";

import { headers } from "next/headers";
import Stripe from "stripe";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { actionClient } from "@/lib/next-safe-action";
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-05-28.basil",
    });
    const { id: sessionId } = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
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
