import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/db";
import { usersTable } from "@/db/schema";
import { planForPriceId } from "@/lib/stripe-plan";

interface InvoiceParent {
  subscription_details?: {
    subscription?: string;
    metadata?: {
      userId?: string;
    };
  };
}

interface LineParent {
  subscription_item_details?: {
    subscription?: string;
  };
}

export const POST = async (request: Request) => {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe secret key not found");
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    throw new Error("Stripe signature not found");
  }

  const rawBody = await request.text();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-05-28.basil",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json(
      { error: "Webhook Error: Invalid signature" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;

      let subscriptionId: string | undefined;
      let userId: string | undefined;

      const invoiceParent = invoice.parent as InvoiceParent | undefined;
      if (
        invoiceParent &&
        invoiceParent.subscription_details &&
        invoiceParent.subscription_details.metadata &&
        invoiceParent.subscription_details.metadata.userId
      ) {
        subscriptionId = invoiceParent.subscription_details.subscription;
        userId = invoiceParent.subscription_details.metadata.userId;
      } else if (
        invoice.lines &&
        Array.isArray(invoice.lines.data) &&
        invoice.lines.data.length > 0
      ) {
        const line = invoice.lines.data[0];
        const lineParent = line.parent as LineParent | undefined;
        if (
          line &&
          line.metadata &&
          line.metadata.userId &&
          lineParent &&
          lineParent.subscription_item_details &&
          lineParent.subscription_item_details.subscription
        ) {
          userId = line.metadata.userId;
          subscriptionId = lineParent.subscription_item_details.subscription;
        }
      }

      if (!subscriptionId) {
        throw new Error("Subscription ID not found in invoice.paid event");
      }
      if (!userId) {
        throw new Error("User ID not found in invoice.paid event");
      }

      // Subscriptions created before plans existed only had the Essencial price.
      const plan =
        planForPriceId(invoice.lines?.data[0]?.pricing?.price_details?.price) ??
        "essential";

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: invoice.customer as string,
          plan,
        })
        .where(eq(usersTable.id, userId));
      break;
    }
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      let userId = subscription.metadata?.userId;

      if (!userId && subscription.customer) {
        const user = await db.query.usersTable.findFirst({
          where: eq(
            usersTable.stripeCustomerId,
            subscription.customer as string,
          ),
        });
        if (user?.id) {
          userId = user.id;
        }
      }

      if (!userId) {
        throw new Error(
          "User ID not found in customer.subscription.deleted event",
        );
      }

      await db
        .update(usersTable)
        .set({
          stripeSubscriptionId: null,
          stripeCustomerId: null,
          plan: null,
        })
        .where(eq(usersTable.id, userId as string));
      break;
    }
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      let userId = subscription.metadata?.userId;

      if (!userId && subscription.customer) {
        const user = await db.query.usersTable.findFirst({
          where: eq(
            usersTable.stripeCustomerId,
            subscription.customer as string,
          ),
        });
        if (user?.id) {
          userId = user.id;
        }
      }

      if (!userId) {
        throw new Error(
          "User ID not found in customer.subscription.updated event",
        );
      }

      // A cancellation scheduled for the end of the period keeps the plan until
      // then; Stripe sends customer.subscription.deleted when it actually ends.
      if (subscription.status === "canceled") {
        await db
          .update(usersTable)
          .set({
            stripeSubscriptionId: null,
            stripeCustomerId: null,
            plan: null,
          })
          .where(eq(usersTable.id, userId));
      } else if (
        subscription.status === "active" ||
        subscription.status === "trialing"
      ) {
        // Upgrades and downgrades made in the customer portal arrive here.
        const plan = planForPriceId(subscription.items.data[0]?.price.id);
        if (plan) {
          await db
            .update(usersTable)
            .set({ plan, stripeSubscriptionId: subscription.id })
            .where(eq(usersTable.id, userId));
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
};
