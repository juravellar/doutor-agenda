import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auth } from "@/lib/auth";

import ClinicForm from "./_components/form";

const ClinicFormPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/authentication");
  }
  const { clinics, clinicLimit } = session.user;
  const isFirstClinic = clinics.length === 0;
  if (clinicLimit !== null && clinics.length >= clinicLimit) {
    redirect(isFirstClinic ? "/dashboard" : "/clinics");
  }
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isFirstClinic ? "Cadastro de clínica" : "Nova clínica"}
          </DialogTitle>
          <DialogDescription>
            {isFirstClinic
              ? "Adicione uma clínica para continuar."
              : "A nova clínica fica ativa assim que for criada."}
          </DialogDescription>
        </DialogHeader>
        <ClinicForm canCancel={!isFirstClinic} />
      </DialogContent>
    </Dialog>
  );
};

export default ClinicFormPage;
