import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isEmailConfigured } from "@/lib/email";

import { AuthPageShell } from "../_components/auth-page-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha | Avelliq" };

// The email is sent in the background, so a missing email provider would not
// surface as an error: the page would promise a link that never arrives.
export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  const support = process.env.SUPPORT_EMAIL;
  return (
    <AuthPageShell>
      {isEmailConfigured() ? (
        <ForgotPasswordForm />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recuperação de senha indisponível</CardTitle>
            <CardDescription>
              No momento não conseguimos enviar o link por email.
              {support ? (
                <>
                  {" "}
                  Fale com o suporte em{" "}
                  <a href={`mailto:${support}`} className="underline">
                    {support}
                  </a>
                  .
                </>
              ) : (
                " Fale com o suporte."
              )}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/authentication">Voltar para o login</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </AuthPageShell>
  );
}
