import { eq } from "drizzle-orm";
import { headers } from "next/headers";
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
import { auth } from "@/lib/auth";
import { createGate } from "@/lib/create-gate";
import { isReadOnly } from "@/lib/free-period";
import { getPlanUsage } from "@/lib/plan-usage";

import AddPatientButton from "./_components/add-patient-button";
import { patientsTableColumns } from "./_components/table.columns";

const PatientsPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, session.user.clinic.id),
  });
  const usage = await getPlanUsage(session.user.clinic.id, session.user.plan);
  const readOnly = isReadOnly(
    session.user.plan,
    session.user.clinic.createdAt,
  );
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
            gate={createGate(usage.patients, readOnly, {
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