"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { caretAfterDigits, editPhone, formatPhone } from "@/helpers/phone";

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
  ref,
  ...props
}: PhoneInputProps) {
  const input = React.useRef<HTMLInputElement | null>(null);
  // Read at keydown, before the edit replaces the selection.
  const hadSelection = React.useRef(false);
  const formatted = formatPhone(value ?? "");

  const setRefs = (element: HTMLInputElement | null) => {
    input.current = element;
    if (typeof ref === "function") {
      ref(element);
    } else if (ref) {
      ref.current = element;
    }
  };

  return (
    <Input
      {...props}
      ref={setRefs}
      type="tel"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      value={formatted}
      onKeyDown={(event) => {
        const { selectionStart, selectionEnd } = event.currentTarget;
        hadSelection.current = selectionStart !== selectionEnd;
        props.onKeyDown?.(event);
      }}
      onChange={(event) => {
        const { digits, digitsBeforeCaret } = editPhone(
          formatted,
          event.target.value,
          event.target.selectionStart ?? event.target.value.length,
          {
            erasingForward:
              (event.nativeEvent as InputEvent).inputType ===
              "deleteContentForward",
            hadSelection: hadSelection.current,
          },
        );
        hadSelection.current = false;
        onValueChange(digits);
        // Reformatting moves the cursor to the end; once the new text is on
        // screen, put it back after the same digit.
        requestAnimationFrame(() => {
          const element = input.current;
          if (element && document.activeElement === element) {
            const position = caretAfterDigits(element.value, digitsBeforeCaret);
            element.setSelectionRange(position, position);
          }
        });
      }}
    />
  );
}
