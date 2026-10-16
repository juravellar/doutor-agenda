import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { DataTable } from "@/components/ui/data-table";
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
import { patientsTable } from "@/db/schema";
import { createGate } from "@/lib/create-gate";
import { writeBlock } from "@/lib/free-period";
import { getPlanUsage } from "@/lib/plan-usage";
import { getServerSession } from "@/lib/server-session";

import AddPatientButton from "./_components/add-patient-button";
import { patientsTableColumns } from "./_components/table.columns";

const PatientsPage = async () => {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, session.user.clinic.id),
  });
  const usage = await getPlanUsage(
    session.user.clinic.id,
    session.user.plan,
    session.user.clinics.length,
  );
  const block = writeBlock(session.user);
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Pacientes</PageTitle>
          <PageDescription>
            Gerencie os pacientes da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton
            gate={createGate(usage.patients, block, {
              one: "paciente",
              many: "pacientes",
            })}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        <DataTable columns={patientsTableColumns} data={patients} />
      </PageContent>
    </PageContainer>
  );
};

export default PatientsPage;
