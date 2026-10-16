import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import {
  PageActions,
  PageContainer,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderContent,
  PageTitle,
} from "@/components/ui/page-container";
import { db } from "@/db";
import { appointmentsTable, doctorsTable, patientsTable } from "@/db/schema";
import { createGate } from "@/lib/create-gate";
import { writeBlockReason } from "@/lib/free-period";
import { getPlanUsage } from "@/lib/plan-usage";
import { getServerSession } from "@/lib/server-session";

import AddAppointmentButton from "./_components/add-appointments-button";
import { AppointmentsTable } from "./_components/appointments-table";

const AppointmentsPage = async () => {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/authentication");
  }

  if (!session.user.clinic) {
    redirect("/clinic-form");
  }


  const clinicId = session.user.clinic.id;

  const [patients, doctors, appointments] = await Promise.all([
    db.query.patientsTable.findMany({
      where: eq(patientsTable.clinicId, clinicId),
    }),
    db.query.doctorsTable.findMany({
      where: eq(doctorsTable.clinicId, clinicId),
    }),
    db.query.appointmentsTable.findMany({
      where: eq(appointmentsTable.clinicId, clinicId),
      with: {
        patient: true,
        doctor: true,
      },
    }),
  ]);

  const usage = await getPlanUsage(
    session.user.clinic.id,
    session.user.plan,
    session.user.clinics.length,
  );
  const blockReason = writeBlockReason(session.user);
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Agendamentos</PageTitle>
          <PageDescription>
            Gerencie os agendamentos da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddAppointmentButton
            patients={patients}
            doctors={doctors}
            gate={createGate(
              usage.appointmentsPerMonth,
              blockReason,
              { one: "agendamento", many: "agendamentos" },
              " neste mês",
            )}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <AppointmentsTable
          appointments={appointments}
          doctors={doctors}
          patients={patients}
        />
      </PageContent>
    </PageContainer>
  );
};

export default AppointmentsPage;
