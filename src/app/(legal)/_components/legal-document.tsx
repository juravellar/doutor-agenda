import type { ReactNode } from "react";

import { TERMS_VERSION } from "@/lib/terms";

// Identification comes from the environment, never from the code: the
// repository is public and must not carry the owner's personal data.
export const legalCnpj = () => process.env.LEGAL_CNPJ || null;

export function ContactEmail() {
  const email = process.env.SUPPORT_EMAIL;
  return email ? (
    <a href={`mailto:${email}`} className="underline">
      {email}
    </a>
  ) : (
    <>o canal de suporte informado no aplicativo</>
  );
}

export function LegalDocument({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [year, month, day] = TERMS_VERSION.split("-");
  return (
    <article className="space-y-4 text-sm leading-relaxed text-foreground [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground">
          Versão de {day}/{month}/{year}
        </p>
      </header>
      {children}
    </article>
  );
}
