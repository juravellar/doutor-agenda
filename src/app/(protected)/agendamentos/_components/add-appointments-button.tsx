"use client";

import { doctorsTable } from "@/db/schema";
import type { CreateGate } from "@/lib/create-gate";

import { CreateButton } from "../../_components/create-button";
import UpsertAppointmentForm from "./add-appointment-form";
import type { PatientOption } from "./patient-option";

interface AddAppointmentButtonProps {
  patients: PatientOption[];
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
