"use client";

import { doctorsTable, patientsTable } from "@/db/schema";
import type { CreateGate } from "@/lib/create-gate";

import { CreateButton } from "../../_components/create-button";
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
}: AddAppointmentButtonProps) => (
  <CreateButton
    gate={gate}
    label="Novo agendamento"
    renderForm={({ isOpen, close }) => (
      <UpsertAppointmentForm
        isOpen={isOpen}
        patients={patients}
        doctors={doctors}
        onSuccess={close}
      />
    )}
  />
);

export default AddAppointmentButton;
