"use client";

import Link from "next/link";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BLOCKED_COPY, type BlockedKind } from "@/lib/create-gate";

// Explains why something can't be created instead of a silently disabled
// button, and points to the way out.
export function BlockedCreateDialog({
  open,
  onOpenChange,
  kind,
  usageText,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: BlockedKind;
  usageText: string | null;
}) {
  const copy = BLOCKED_COPY[kind];
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {usageText && kind === "limit"
              ? `Você está usando ${usageText}. `
              : ""}
            {copy.next}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Agora não</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href={copy.href}>{copy.action}</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
