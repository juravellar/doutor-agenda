export const PHONE_MAX_DIGITS = 11;

export const phoneDigits = (value: string) =>
  value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS);

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
