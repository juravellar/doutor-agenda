"use client";

import type { CreateGate } from "@/lib/create-gate";

import { CreateButton } from "../../_components/create-button";
import UpsertPatientForm from "./upsert-patient-form";

const AddPatientButton = ({ gate }: { gate: CreateGate }) => (
  <CreateButton
    gate={gate}
    label="Adicionar paciente"
    renderForm={({ isOpen, close }) => (
      <UpsertPatientForm onSuccess={close} isOpen={isOpen} />
    )}
  />
);

export default AddPatientButton;
