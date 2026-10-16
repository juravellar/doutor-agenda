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
import { writeBlockReason } from "@/lib/free-period";
import { getPlanUsage } from "@/lib/plan-usage";
import { getServerSession } from "@/lib/server-session";

import AddPatientButton from "./_components/add-patient-button";
import { patientsTableColumns } from "./_components/table.columns";

const PatientsPage = async () => {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/entrar");
  }
  if (!session.user.clinic) {
    redirect("/nova-clinica");
  }
  const patients = await db.query.patientsTable.findMany({
    where: eq(patientsTable.clinicId, session.user.clinic.id),
  });
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
          <PageTitle>Pacientes</PageTitle>
          <PageDescription>
            Gerencie os pacientes da sua clínica
          </PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddPatientButton
            gate={createGate(usage.patients, blockReason, {
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