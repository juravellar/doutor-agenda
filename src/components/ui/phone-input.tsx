"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { formatPhone, phoneDigits } from "@/helpers/phone";

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  // Digits only, e.g. "1133334444".
  value: string | undefined;
  onValueChange: (digits: string) => void;
};

// Fits landlines (10 digits) and mobiles (11); a fixed mask can only show one.
export function PhoneInput({
  value,
  onValueChange,
  placeholder = "(11) 99999-9999",
  ...props
}: PhoneInputProps) {
  const formatted = formatPhone(value ?? "");
  return (
    <Input
      {...props}
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatted}
      onChange={(event) => {
        let digits = phoneDigits(event.target.value);
        // Erasing a "(", ")", space or "-" leaves the digits as they were, so
        // the formatting would put it right back; erase the digit before it.
        if (
          digits === phoneDigits(formatted) &&
          event.target.value.length < formatted.length
        ) {
          digits = digits.slice(0, -1);
        }
        onValueChange(digits);
      }}
    />
  );
}
