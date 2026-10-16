"use client";

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

const STRIPE_CHECKOUT_ORIGIN = "https://checkout.stripe.com";

interface PlanCardProps {
  plan: Plan;
  price: PlanPrice | null;
  currentPlanId: PlanId;
  userEmail: string;
  // State of the current paid subscription, shown on its card.
  subscriptionNotice?: { endsOn: string | null; pastDue: boolean };
  className?: string;
}

export function PlanCard({
  plan,
  price,
  currentPlanId,
  userEmail,
  subscriptionNotice,
  className,
}: PlanCardProps) {
  const router = useRouter();
  const createStripeCheckoutAction = useAction(createStripeCheckout, {
    onSuccess: ({ data }) => {
      // Only ever leave the app for Stripe's own checkout page.
      if (!data?.url || new URL(data.url).origin !== STRIPE_CHECKOUT_ORIGIN) {
        toast.error("Não foi possível iniciar o pagamento. Tente novamente.");
        return;
      }
      window.location.assign(data.url);
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
      // Already canceled: the account returns to Free on its own.
      return isCurrent || subscriptionNotice?.endsOn
        ? null
        : { label: "Voltar para o Free", onClick: openCustomerPortal };
    }
    if (isCurrent) {
      const label = subscriptionNotice?.pastDue
        ? "Atualizar pagamento"
        : subscriptionNotice?.endsOn
          ? "Reativar assinatura"
          : "Gerenciar assinatura";
      return { label, onClick: openCustomerPortal };
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
        isCurrent && "border-success ring-1 ring-success",
        className,
      )}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
          {isCurrent &&
            (subscriptionNotice?.pastDue || subscriptionNotice?.endsOn ? (
              <Badge className="shrink-0 bg-warning-muted text-warning-foreground hover:bg-warning-muted">
                {subscriptionNotice.pastDue
                  ? "Pagamento pendente"
                  : "Cancelada"}
              </Badge>
            ) : (
              <Badge className="shrink-0 bg-success-muted text-success-foreground hover:bg-success-muted">
                Atual
              </Badge>
            ))}
        </div>
        <p className="text-muted-foreground">{plan.description}</p>
        {isCurrent && subscriptionNotice?.endsOn && (
          <p className="text-sm text-warning-foreground">
            Acesso até {subscriptionNotice.endsOn}. Depois disso, a conta volta
            para o Free.
          </p>
        )}
        {plan.id === "free" ? (
          <span className="text-3xl font-bold text-foreground">Grátis</span>
        ) : (
          price && (
            <div className="flex items-baseline">
              <span className="text-3xl font-bold text-foreground">
                {price.amount}
              </span>
              {price.interval && (
                <span className="ml-1 text-muted-foreground">/ {price.interval}</span>
              )}
            </div>
          )
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 border-t border-border pt-6">
          {plan.features.map((feature) => (
            <div key={feature} className="flex items-start">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
              <p className="ml-3 text-muted-foreground">{feature}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 min-h-10">
          {plan.id === "free" && !isCurrent && subscriptionNotice?.endsOn && (
            <p className="text-center text-sm text-muted-foreground">
              A conta volta para o Free em {subscriptionNotice.endsOn}.
            </p>
          )}
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
