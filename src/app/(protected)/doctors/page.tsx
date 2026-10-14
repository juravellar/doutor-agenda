import { eq } from "drizzle-orm";
import { headers } from "next/headers";
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
import { doctorsTable } from "@/db/schema";
import { createGate } from "@/lib/create-gate";
import { isReadOnly } from "@/lib/free-period";
import { getPlanUsage } from "@/lib/plan-usage";

import { auth } from "../../../lib/auth";
import AddDoctorButton from "./_components/add-doctor-button";
import DoctorCard from "./_components/doctor-card";

const DoctorsPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/authentication");
  }


  if (!session?.user.clinic) {
    redirect("/clinic-form");
  }

  const doctors = await db.query.doctorsTable.findMany({
    where: eq(doctorsTable.clinicId, session.user.clinic.id),
  });

  const hasDoctors = doctors.length > 0;

  const usage = await getPlanUsage(session.user.clinic.id, session.user.plan);
  const readOnly = isReadOnly(
    session.user.plan,
    session.user.clinic.createdAt,
  );
  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Médicos</PageTitle>
          <PageDescription>Gerencie os médicos da sua clínica</PageDescription>
        </PageHeaderContent>
        <PageActions>
          <AddDoctorButton
            gate={createGate(usage.doctors, readOnly, {
              one: "médico",
              many: "médicos",
            })}
          />
        </PageActions>
      </PageHeader>
      <PageContent>
        {hasDoctors ? (
          <div className="flex flex-wrap justify-start gap-6">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 w-full">
            <span className="text-muted-foreground text-lg mb-4">
              Nenhum médico cadastrado.
            </span>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
};

export default DoctorsPage;
