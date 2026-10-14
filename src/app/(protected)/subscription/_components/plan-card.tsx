"use client";

import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { createStripeCheckout } from "@/actions/create-stripe-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { actionErrorMessage } from "@/lib/action-errors";
import type { Plan, PlanId } from "@/lib/plans";
import type { PlanPrice } from "@/lib/stripe-plan";
import { cn } from "@/lib/utils";

interface PlanCardProps {
  plan: Plan;
  price: PlanPrice | null;
  currentPlanId: PlanId;
  userEmail: string;
  className?: string;
}

export function PlanCard({
  plan,
  price,
  currentPlanId,
  userEmail,
  className,
}: PlanCardProps) {
  const router = useRouter();
  const createStripeCheckoutAction = useAction(createStripeCheckout, {
    onSuccess: async ({ data }) => {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error("Stripe publishable key not found");
      }
      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      );
      if (!stripe) {
        throw new Error("Stripe not found");
      }
      if (!data?.sessionId) {
        throw new Error("Session ID not found");
      }
      await stripe.redirectToCheckout({
        sessionId: data.sessionId,
      });
    },
    onError: ({ error }) => {
      toast.error(
        actionErrorMessage(
          error,
          "Não foi possível iniciar o pagamento. Tente novamente.",
        ),
      );
    },
  });

  const isCurrent = plan.id === currentPlanId;
  const hasPaidPlan = currentPlanId !== "free";

  // Plan changes and cancellations of an existing subscription go through the
  // Stripe customer portal, which handles proration and the end of the period.
  const openCustomerPortal = () => {
    router.push(
      `${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${encodeURIComponent(userEmail)}`,
    );
  };

  const action = (() => {
    if (plan.id === "free") {
      return isCurrent
        ? null
        : { label: "Voltar para o Free", onClick: openCustomerPortal };
    }
    if (isCurrent) {
      return { label: "Gerenciar assinatura", onClick: openCustomerPortal };
    }
    if (hasPaidPlan) {
      return { label: `Mudar para ${plan.name}`, onClick: openCustomerPortal };
    }
    const paidPlanId = plan.id;
    return {
      label: `Assinar ${plan.name}`,
      onClick: () => createStripeCheckoutAction.execute({ plan: paidPlanId }),
    };
  })();

  return (
    <Card
      className={cn(
        "flex flex-col",
        isCurrent && "border-green-500 ring-1 ring-green-500",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
          {isCurrent && (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              Atual
            </Badge>
          )}
        </div>
        <p className="text-gray-600">{plan.description}</p>
        {plan.id === "free" ? (
          <span className="text-3xl font-bold text-gray-900">Grátis</span>
        ) : (
          price && (
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">
                {price.amount}
              </span>
              {price.interval && (
                <span className="ml-1 text-gray-600">/ {price.interval}</span>
              )}
            </div>
          )
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 border-t border-gray-200 pt-6">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
              <p className="ml-3 text-gray-600">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 min-h-10">
          {action && (
            <Button
              className="w-full"
              variant={isCurrent ? "outline" : "default"}
              onClick={action.onClick}
              disabled={createStripeCheckoutAction.isExecuting}
            >
              {createStripeCheckoutAction.isExecuting ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                action.label
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
