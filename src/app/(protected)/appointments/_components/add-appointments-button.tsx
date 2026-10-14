"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { doctorsTable, patientsTable } from "@/db/schema";
import type { CreateGate } from "@/lib/create-gate";

import { CreateGateHint } from "../../_components/create-gate-hint";
import UpsertAppointmentForm from "./add-appointment-form";

interface AddAppointmentButtonProps {
  patients: (typeof patientsTable.$inferSelect)[];
  doctors: (typeof doctorsTable.$inferSelect)[];
  gate: CreateGate;
}

const AddAppointmentButton = ({
  patients,
  doctors,
  gate,
}: AddAppointmentButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button disabled={Boolean(gate.blockedReason)}>
            <Plus />
            Novo agendamento
          </Button>
        </DialogTrigger>
        <UpsertAppointmentForm
          isOpen={isOpen}
          patients={patients}
          doctors={doctors}
          onSuccess={() => setIsOpen(false)}
        />
      </Dialog>
      <CreateGateHint gate={gate} />
    </div>
  );
};

export default AddAppointmentButton;
