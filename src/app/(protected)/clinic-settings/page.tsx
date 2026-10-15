import { eq } from "drizzle-orm";
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
import { db } from "@/db";
import { clinicsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { writeBlockReason } from "@/lib/free-period";

import { ClinicSettingsForm } from "./_components/clinic-settings-form";

const ClinicSettingsPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/authentication");
  }
  if (!session.user.clinic) {
    redirect("/clinic-form");
  }
  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, session.user.clinic.id),
  });
  if (!clinic) {
    redirect("/clinic-form");
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageHeaderContent>
          <PageTitle>Configurações da clínica</PageTitle>
          <PageDescription>
            Dados da clínica aberta agora: {clinic.name}.
          </PageDescription>
        </PageHeaderContent>
      </PageHeader>
      <PageContent>
        <ClinicSettingsForm
          // Re-mount with fresh values when another clinic is opened.
          key={clinic.id}
          clinic={{
            name: clinic.name,
            address: clinic.address ?? "",
            phoneNumber: clinic.phoneNumber ?? "",
          }}
          blockReason={writeBlockReason(session.user)}
        />
      </PageContent>
    </PageContainer>
  );
};

export default ClinicSettingsPage;
