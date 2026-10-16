import { z } from "zod";

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export const formatCurrencyInCents = (amount: number) =>
  brl.format(amount / 100);

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

// Typed digits fill the value from the right, like a bank app: 1 → R$ 0,01,
// 15000 → R$ 150,00. No cursor jumps, no comma to type.
export const digitsToReais = (text: string) => {
  const digits = text.replace(/\D/g, "").replace(/^0+/, "").slice(0, 9);
  return digits ? Number(digits) / 100 : 0;
};

// Empty for zero, so an input shows its placeholder instead of "R$ 0,00".
export const formatReais = (reais: number) =>
  reais > 0 ? brl.format(reais) : "";
