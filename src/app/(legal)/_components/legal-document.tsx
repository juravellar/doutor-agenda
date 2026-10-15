import type { ReactNode } from "react";

import { TERMS_VERSION } from "@/lib/terms";

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
    <article className="space-y-4 text-sm leading-relaxed text-gray-800 [&_h2]:pt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-muted-foreground">
          Versão de {day}/{month}/{year}
        </p>
      </header>
      {children}
    </article>
  );
}
