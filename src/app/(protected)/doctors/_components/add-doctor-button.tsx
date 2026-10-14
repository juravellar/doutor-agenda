"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { CreateGate } from "@/lib/create-gate";

import { CreateGateHint } from "../../_components/create-gate-hint";
import UpsertDoctorForm from "./upsert-doctor-form";

const AddDoctorButton = ({ gate }: { gate: CreateGate }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col items-end gap-1">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button disabled={Boolean(gate.blockedReason)}>
            <Plus />
            Adicionar médico
          </Button>
        </DialogTrigger>
        <UpsertDoctorForm onSuccess={() => setIsOpen(false)} isOpen={isOpen} />
      </Dialog>
      <CreateGateHint gate={gate} />
    </div>
  );
};

export default AddDoctorButton;
