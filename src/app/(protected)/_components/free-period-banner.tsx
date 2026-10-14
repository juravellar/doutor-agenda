"use client";

import Link from "next/link";

import { authClient } from "@/lib/auth-client";
import { freePeriodDaysLeft, isReadOnly } from "@/lib/free-period";
import { isPaidPlan } from "@/lib/plans";

// Remaining days are only highlighted near the end, to avoid nagging.
const WARNING_DAYS = 14;

export function FreePeriodBanner() {
  const session = authClient.useSession();
  const user = session.data?.user;
  if (!user?.clinic || isPaidPlan(user.plan)) {
    return null;
  }

  const createdAt = user.clinic.createdAt;
  if (isReadOnly(user.plan, createdAt)) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
        Seu período gratuito terminou. Você continua vendo seus dados, mas para
        cadastrar e editar é preciso{" "}
        <Link href="/subscription" className="font-medium underline">
          assinar um plano
        </Link>
        .
      </div>
    );
  }

  const daysLeft = freePeriodDaysLeft(createdAt);
  if (daysLeft > WARNING_DAYS) {
    return null;
  }
  return (
    <div className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-900">
      {daysLeft === 0
        ? "Seu período gratuito termina hoje."
        : `Seu período gratuito termina em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}.`}{" "}
      <Link href="/subscription" className="font-medium underline">
        Ver planos
      </Link>
    </div>
  );
}
