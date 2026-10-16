"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import ClinicForm from "../clinic-form/_components/form";

// Opens over the current page, so what the user was looking at stays behind
// the dialog. The /clinic-form page is only for the first clinic.
export function NewClinicDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova clínica</DialogTitle>
          <DialogDescription>
            A nova clínica fica ativa assim que for criada.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ClinicForm
            onCancel={() => onOpenChange(false)}
            onCreated={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
