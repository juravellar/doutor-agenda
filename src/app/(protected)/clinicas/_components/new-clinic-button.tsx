"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

import { NewClinicDialog } from "../../_components/new-clinic-dialog";

export function NewClinicButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Nova clínica</Button>
      <NewClinicDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
