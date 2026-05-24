/** Normalize NANP input to E.164 (+1...) for SMS providers. Returns null if invalid. */
export function normalizePhoneToE164(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

/** Store digits only (10-digit NANP) from formatted display input. */
export function normalizePhoneForStorage(input: string | null | undefined): string | null {
  if (!input?.trim()) return null;
  const digits = input.replace(/\D/g, '').slice(0, 10);
  return digits.length === 10 ? digits : null;
}
