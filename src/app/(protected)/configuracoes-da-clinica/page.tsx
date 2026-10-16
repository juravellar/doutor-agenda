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
import { writeBlockReason } from "@/lib/free-period";
import { getServerSession } from "@/lib/server-session";

import { ClinicSettingsForm } from "./_components/clinic-settings-form";

const ClinicSettingsPage = async () => {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/entrar");
  }
  if (!session.user.clinic) {
    redirect("/nova-clinica");
  }
  const clinic = await db.query.clinicsTable.findFirst({
    where: eq(clinicsTable.id, session.user.clinic.id),
  });
  if (!clinic) {
    redirect("/nova-clinica");
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
            brandColor: clinic.brandColor ?? "",
            logoDataUrl: clinic.logoDataUrl ?? "",
          }}
          blockReason={writeBlockReason(session.user)}
        />
      </PageContent>
    </PageContainer>
  );
};

export default ClinicSettingsPage;
