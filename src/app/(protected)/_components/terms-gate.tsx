"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { acceptTerms } from "@/actions/accept-terms";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { needsTermsAcceptance, TERMS_VERSION } from "@/lib/terms";

import { useSessionUser } from "./session-provider";

// Accounts created before the terms existed, or that accepted an older
// version, must accept the current one before using the app.
export function TermsGate() {
  const router = useRouter();
  const user = useSessionUser();
  const accept = useAction(acceptTerms, {
    onSuccess: () => router.refresh(),
    onError: () => toast.error("Não foi possível registrar o aceite."),
  });
  if (!needsTermsAcceptance(user.termsVersion)) {
    return null;
  }

  const signOut = () =>
    authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/authentication") },
    });

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Termos de Uso e Privacidade</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Para continuar usando o Avelliq, leia e aceite os{" "}
                <Link href="/termos" target="_blank" className="underline">
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/privacidade" target="_blank" className="underline">
                  Política de Privacidade
                </Link>
                .
              </p>
              <p>
                Eles explicam como os dados da sua conta e dos seus pacientes
                são tratados e quais são os seus direitos pela LGPD.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
          <Button
            disabled={accept.isPending}
            onClick={() => accept.execute({ version: TERMS_VERSION })}
          >
            Li e aceito
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
