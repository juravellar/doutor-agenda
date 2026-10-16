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
import type { BlockedKind } from "@/lib/create-gate";

const COPY: Record<
  BlockedKind,
  { title: string; next: string; href: string; action: string }
> = {
  limit: {
    title: "Limite do plano atingido",
    next: "Para cadastrar mais, escolha um plano maior.",
    href: "/subscription",
    action: "Ver planos",
  },
  "free-period-over": {
    title: "Período gratuito encerrado",
    next: "Seus dados continuam disponíveis. Para voltar a cadastrar e editar, assine um plano.",
    href: "/subscription",
    action: "Ver planos",
  },
  "read-only": {
    title: "Clínica só leitura",
    next: "Escolha quais clínicas ficam ativas no seu plano ou faça upgrade.",
    href: "/clinics",
    action: "Minhas clínicas",
  },
};

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
  const copy = COPY[kind];
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
