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
import { auth } from "@/lib/auth";
import { PLANS, resolvePlan } from "@/lib/plans";
import { getPlanPrices } from "@/lib/stripe-plan";

import { PlanCard } from "./_components/plan-card";

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
  const prices = await getPlanPrices();
  const currentPlanId = resolvePlan(session.user.plan).id;
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
        <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              price={plan.id === "free" ? null : prices[plan.id]}
              currentPlanId={currentPlanId}
              userEmail={session.user.email}
            />
          ))}
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default SubscriptionPage;
