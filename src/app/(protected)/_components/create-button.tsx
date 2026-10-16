"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import type { CreateGate } from "@/lib/create-gate";

import { BlockedCreateDialog } from "./blocked-create-dialog";
import { CreateGateHint } from "./create-gate-hint";

// The "add" button of a list page. When the plan or the clinic doesn't allow
// creating, it stays clickable and explains why instead of opening the form.
export function CreateButton({
  gate,
  label,
  renderForm,
}: {
  gate: CreateGate;
  label: string;
  renderForm: (props: { isOpen: boolean; close: () => void }) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const content = (
    <>
      <Plus />
      {label}
    </>
  );
  return (
    <div className="flex flex-col items-end gap-1">
      {gate.blockedKind ? (
        <>
          <Button onClick={() => setIsOpen(true)}>{content}</Button>
          <BlockedCreateDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            kind={gate.blockedKind}
            usageText={gate.usageText}
          />
        </>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>{content}</Button>
          </DialogTrigger>
          {renderForm({ isOpen, close: () => setIsOpen(false) })}
        </Dialog>
      )}
      <CreateGateHint gate={gate} />
    </div>
  );
}
