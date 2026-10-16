import { Calendar } from "lucide-react";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { dashboardRange } from "@/helpers/dashboard-range";
import { clinicToday } from "@/helpers/time";
import { getServerSession } from "@/lib/server-session";

import { getDashboard } from "../../../../data/get-dashboard";
import AppointmentsChart from "./_components/appointments-charts";
import { CheckoutReturnRefresh } from "./_components/checkout-return-refresh";
import DashboardAppointmentsTable from "./_components/dashboard-appointments-table";
import { DashboardCardHeader } from "./_components/dashboard-card-header";
import { DatePicker } from "./_components/date-picker";
import StatsCards from "./_components/stats-cards";
import TopDoctors from "./_components/top-doctors";
import TopSpecialties from "./_components/top-specialties";

interface DashboardPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

const DashboardPage = async ({ searchParams }: DashboardPageProps) => {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }

  // Missing dates are filled in here and rendered right away, instead of
  // redirecting to a URL that carries them (an extra round trip that left the
  // page blank on client navigation).
  const { from, to } = dashboardRange(await searchParams, clinicToday());

  const {
    totalRevenue,
    totalAppointments,
    totalPatients,
    totalDoctors,
    topDoctors,
    topSpecialties,
    todayAppointments,
    allPatients,
    allDoctors,
    dailyAppointmentsData,
  } = await getDashboard({
    from,
    to,
    session: {
      user: {
        clinic: {
          id: session.user.clinic.id,
        },
      },
    },
  });
  return (
    <PageContainer>
      <Suspense>
        <CheckoutReturnRefresh />
      </Suspense>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Dashboard</PageTitle>
          <PageDescription>
            Tenha uma visão geral da sua clínica.
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <DatePicker from={from} to={to} />
        </PageActions>
      </PageHeader>
      <PageContent>
        <StatsCards
          totalRevenue={totalRevenue.total ? Number(totalRevenue.total) : null}
          totalAppointments={totalAppointments.total}
          totalPatients={totalPatients.total}
          totalDoctors={totalDoctors.total}
        />
        <div className="grid gap-4 lg:grid-cols-[2.25fr_1fr] [&>*]:min-w-0">
          <AppointmentsChart dailyAppointmentsData={dailyAppointmentsData} />
          <TopDoctors doctors={topDoctors} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[2.25fr_1fr] [&>*]:min-w-0">
          <Card>
            <DashboardCardHeader icon={Calendar} title="Agendamentos de hoje" />
            <CardContent>
              <DashboardAppointmentsTable
                appointments={todayAppointments}
                patients={allPatients}
                doctors={allDoctors}
              />
            </CardContent>
          </Card>
          <TopSpecialties topSpecialties={topSpecialties} />
        </div>
      </PageContent>
    </PageContainer>
  );
};

export default DashboardPage;
