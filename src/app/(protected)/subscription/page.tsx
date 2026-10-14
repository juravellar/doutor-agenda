import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { inClinicTimezone } from "@/helpers/time";
import { auth } from "@/lib/auth";
import { getPlanUsage } from "@/lib/plan-usage";
import { PLANS, resolvePlan } from "@/lib/plans";
import { getPlanPrices } from "@/lib/stripe-plan";

import { PlanCard } from "./_components/plan-card";
import { PlanUsageCard } from "./_components/plan-usage-card";

const SubscriptionPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const currentPlan = resolvePlan(session.user.plan);
  const [prices, usage] = await Promise.all([
    getPlanPrices(),
    getPlanUsage(session.user.clinic.id, session.user.plan),
  ]);
  const subscriptionNotice = {
    pastDue: session.user.subscriptionStatus === "past_due",
    endsOn: session.user.subscriptionEndsAt
      ? inClinicTimezone(session.user.subscriptionEndsAt).format("DD/MM/YYYY")
      : null,
  };
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Assinatura</PageTitle>
          <PageDescription>
            Escolha o plano ideal para a sua clínica.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        {/* Columns follow the content width, not the screen: the sidebar
            takes part of it. */}
        <div className="@container space-y-6">
          <PlanUsageCard planName={currentPlan.name} usage={usage} />
          <div className="grid w-full gap-6 @4xl:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                price={plan.id === "free" ? null : prices[plan.id]}
                currentPlanId={currentPlan.id}
                userEmail={session.user.email}
                subscriptionNotice={subscriptionNotice}
              />
            ))}
          </div>
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default SubscriptionPage;
