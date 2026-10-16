import { redirect } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getServerSession } from "@/lib/server-session";

import ClinicForm from "./_components/form";

const ClinicFormPage = async () => {
  const session = await getServerSession();
  if (!session) {
    redirect("/authentication");
  }
  // Further clinics are created from a dialog over the current page.
  if (session.user.clinics.length > 0) {
    redirect("/clinics");
  }
  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cadastro de clínica</DialogTitle>
          <DialogDescription>
            Adicione uma clínica para continuar.
          </DialogDescription>
        </DialogHeader>
        <ClinicForm />
      </DialogContent>
    </Dialog>
  );
};

export default ClinicFormPage;
