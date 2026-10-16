"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { digitsToReais, formatReais } from "@/helpers/currency";

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  // In reais (150.5 = R$ 150,50); 0 shows the placeholder.
  value: number | undefined;
  onValueChange: (reais: number) => void;
};

export function CurrencyInput({
  value,
  onValueChange,
  placeholder = "R$ 0,00",
  ...props
}: CurrencyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatReais(value ?? 0)}
      onChange={(event) => onValueChange(digitsToReais(event.target.value))}
    />
  );
}
