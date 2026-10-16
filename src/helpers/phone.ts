export const PHONE_MAX_DIGITS = 11;

export const phoneDigits = (value: string) =>
  value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);

const countDigits = (value: string) => value.replace(/\D/g, "").length;

// Brazilian phone as it is typed: landlines have 10 digits, (11) 3333-4444;
// mobiles 11, (11) 99999-9999. The split moves when the 11th digit arrives.
export const formatPhone = (value: string) => {
  const digits = phoneDigits(value);
  if (!digits) {
    return "";
  }
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  const area = digits.slice(0, 2);
  const number = digits.slice(2);
  const split = digits.length === PHONE_MAX_DIGITS ? 5 : 4;
  if (number.length <= split) {
    return `(${area}) ${number}`;
  }
  return `(${area}) ${number.slice(0, split)}-${number.slice(split)}`;
};

// A valid number, landline or mobile.
export const isValidPhone = (value: string) =>
  [10, 11].includes(value.replace(/\D/g, "").length);

/**
 * Applies one edit of the formatted phone field. `edited` is the field's text
 * after the keystroke and `caret` the cursor in it. Returns the digits to keep
 * and how many of them come before the cursor, so the cursor can be put back
 * in the same place after the text is formatted again.
 *
 * Erasing a "(", ")", space or "-" leaves the digits as they were, so the
 * formatting would put it right back; the digit next to it is erased instead.
 */
export const editPhone = (
  previous: string,
  edited: string,
  caret: number,
  erasingForward: boolean,
) => {
  let digits = phoneDigits(edited);
  let digitsBeforeCaret = countDigits(edited.slice(0, caret));
  // Only a single erased character: deleting a selection that happened to
  // hold just a separator must not take a digit with it.
  const separatorErased =
    digits === phoneDigits(previous) && previous.length - edited.length === 1;
  if (separatorErased) {
    const index = erasingForward ? digitsBeforeCaret : digitsBeforeCaret - 1;
    if (index >= 0 && index < digits.length) {
      digits = digits.slice(0, index) + digits.slice(index + 1);
      digitsBeforeCaret = index;
    }
  }
  return {
    digits,
    digitsBeforeCaret: Math.min(digitsBeforeCaret, digits.length),
  };
};

// Where the cursor goes in the formatted text: right after the given number
// of digits.
export const caretAfterDigits = (formatted: string, digits: number) => {
  if (digits <= 0) {
    return formatted.search(/\d/) === -1
      ? formatted.length
      : formatted.search(/\d/);
  }
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (/\d/.test(formatted[index]) && ++seen === digits) {
      return index + 1;
    }
  }
  return formatted.length;
};
