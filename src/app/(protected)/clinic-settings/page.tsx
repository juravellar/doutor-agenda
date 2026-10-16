import { eq } from "drizzle-orm";
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
import { writeBlock } from "@/lib/free-period";
import { getServerSession } from "@/lib/server-session";

import { ClinicSettingsForm } from "./_components/clinic-settings-form";

const ClinicSettingsPage = async () => {
  const session = await getServerSession();
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
          block={writeBlock(session.user)}
        />
      </PageContent>
    </PageContainer>
  );
};

export default ClinicSettingsPage;
