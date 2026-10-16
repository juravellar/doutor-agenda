"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef } from "react";

import { inClinicTimezone } from "@/helpers/time";
import { accountStatus } from "@/lib/account-status";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const customerPortalUrl = (email: string) =>
  `${process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL}?prefilled_email=${encodeURIComponent(email)}`;

function Banner({
  tone,
  children,
}: {
  tone: "warning" | "info";
  children: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn(
        "border-b px-4 py-2 text-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-blue-200 bg-blue-50 text-blue-900",
      )}
    >
      {children}
    </div>
  );
}

const linkClass = "font-medium underline";

// Plan changes reach the database by Stripe webhook, sometimes after the page
// loaded. Navigating doesn't reload the client session, so it is refreshed on
// navigation, but at most once a minute instead of on every page change.
const SESSION_REFRESH_MS = 60_000;

export function AccountStatusBanner() {
  const session = authClient.useSession();
  const { refetch } = session;
  const pathname = usePathname();
  const visitedPath = useRef(pathname);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    if (visitedPath.current === pathname) {
      return;
    }
    visitedPath.current = pathname;
    if (Date.now() - lastRefresh.current < SESSION_REFRESH_MS) {
      return;
    }
    lastRefresh.current = Date.now();
    refetch();
  }, [pathname, refetch]);

  const user = session.data?.user;
  const status = user ? accountStatus(user) : null;
  if (!user || !status) {
    return null;
  }

  switch (status.kind) {
    case "payment-failed":
      return (
        <Banner tone="warning">
          Não conseguimos cobrar sua assinatura do plano {status.planName}.
          Atualize a forma de pagamento para não perder o acesso.{" "}
          <a href={customerPortalUrl(user.email)} className={linkClass}>
            Atualizar pagamento
          </a>
        </Banner>
      );
    case "clinic-read-only":
      return (
        <Banner tone="warning">
          Esta clínica está só leitura porque seu plano permite{" "}
          {status.clinicLimit}{" "}
          {status.clinicLimit === 1 ? "clínica" : "clínicas"}. Você pode ver os
          dados, mas não cadastrar nem editar.{" "}
          <Link href="/clinics" className={linkClass}>
            Minhas clínicas
          </Link>
        </Banner>
      );
    case "choose-clinics":
      return (
        <Banner tone="warning">
          Você tem {status.clinicCount} clínicas e seu plano permite{" "}
          {status.clinicLimit}. Escolha quais continuam ativas.{" "}
          <Link href="/clinics" className={linkClass}>
            Escolher clínicas
          </Link>
        </Banner>
      );
    case "subscription-ending":
      return (
        <Banner tone="info">
          Sua assinatura do plano {status.planName} foi cancelada e termina em{" "}
          {inClinicTimezone(status.endsAt).format("DD/MM/YYYY")}. Depois disso,
          a conta volta para o Free.{" "}
          <a href={customerPortalUrl(user.email)} className={linkClass}>
            Reativar assinatura
          </a>
        </Banner>
      );
    case "free-period-over":
      return (
        <Banner tone="warning">
          Seu período gratuito terminou. Você continua vendo seus dados, mas
          para cadastrar e editar é preciso{" "}
          <Link href="/subscription" className={linkClass}>
            assinar um plano
          </Link>
          .
        </Banner>
      );
    case "free-period-ending":
      return (
        <Banner tone="info">
          {status.daysLeft === 0
            ? "Seu período gratuito termina hoje."
            : `Seu período gratuito termina em ${status.daysLeft} ${status.daysLeft === 1 ? "dia" : "dias"}.`}{" "}
          <Link href="/subscription" className={linkClass}>
            Ver planos
          </Link>
        </Banner>
      );
  }
}
