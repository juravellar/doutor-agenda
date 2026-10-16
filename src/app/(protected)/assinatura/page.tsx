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
import { getPlanUsage } from "@/lib/plan-usage";
import { PLANS, resolvePlan } from "@/lib/plans";
import { getServerSession } from "@/lib/server-session";
import { getPlanPrices } from "@/lib/stripe-plan";

import { PlanCards } from "./_components/plan-cards";
import { PlanUsageCard } from "./_components/plan-usage-card";

const SubscriptionPage = async () => {
  const session = await getServerSession();
  if (!session) {
    redirect("/entrar");
  }
  if (!session.user.clinic) {
    redirect("/nova-clinica");
  }
  const currentPlan = resolvePlan(session.user.plan);
  const [prices, usage] = await Promise.all([
    getPlanPrices(),
    getPlanUsage(
      session.user.clinic.id,
      session.user.plan,
      session.user.clinics.length,
    ),
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
          <PlanCards
            plans={Object.values(PLANS)}
            prices={prices}
            currentPlanId={currentPlan.id}
            userEmail={session.user.email}
            subscriptionNotice={subscriptionNotice}
          />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default SubscriptionPage;
