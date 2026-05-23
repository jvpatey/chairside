/** Formats up to 10 digits as (XXX) XXX-XXXX (NANP). */
export function formatPhoneNumber(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 10);
  const len = digits.length;

  if (len === 0) return '';
  if (len <= 3) return `(${digits}`;
  if (len <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const PHONE_NUMBER_PLACEHOLDER = '(902) 555-0100';