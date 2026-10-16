"use client";

import type { CreateGate } from "@/lib/create-gate";

import { CreateButton } from "../../_components/create-button";
import UpsertDoctorForm from "./upsert-doctor-form";

const AddDoctorButton = ({ gate }: { gate: CreateGate }) => (
  <CreateButton
    gate={gate}
    label="Adicionar médico"
    renderForm={({ isOpen, close }) => (
      <UpsertDoctorForm onSuccess={close} isOpen={isOpen} />
    )}
  />
);

export default AddDoctorButton;
