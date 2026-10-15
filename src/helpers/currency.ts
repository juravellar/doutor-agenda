import { z } from "zod";

export const formatCurrencyInCents = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount / 100);
};

// R$ 100.000,00: far above any consultation, low enough to catch a typo or a
// forged request before it skews the revenue on the dashboard.
export const MAX_PRICE_IN_CENTS = 10_000_000;

export const priceInCentsSchema = (requiredMessage: string) =>
  z
    .number()
    .int()
    .min(1, { message: requiredMessage })
    .max(MAX_PRICE_IN_CENTS, { message: "Valor acima do permitido." });

// Reais typed in the form to cents. Rounded because 150.1 * 100 is
// 15009.999... in floating point.
export const reaisToCents = (reais: number) => Math.round(reais * 100);
