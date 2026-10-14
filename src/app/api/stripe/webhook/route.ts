import { NextResponse } from "next/server";
import Stripe from "stripe";

import { syncSubscription } from "@/lib/stripe-subscription-sync";

interface InvoiceParent {
  subscription_details?: {
    subscription?: string | { id: string };
  };
}

interface LineParent {
  subscription_item_details?: {
    subscription?: string;
  };
}

const subscriptionIdOfInvoice = (invoice: Stripe.Invoice) => {
  const parent = invoice.parent as InvoiceParent | null | undefined;
  const fromParent = parent?.subscription_details?.subscription;
  if (fromParent) {
    return typeof fromParent === "string" ? fromParent : fromParent.id;
  }
  const lineParent = invoice.lines?.data[0]?.parent as LineParent | undefined;
  return lineParent?.subscription_item_details?.subscription;
};

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
      const subscriptionId = subscriptionIdOfInvoice(event.data.object);
      if (subscriptionId) {
        await syncSubscription(stripe, subscriptionId);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(stripe, event.data.object.id);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
};
