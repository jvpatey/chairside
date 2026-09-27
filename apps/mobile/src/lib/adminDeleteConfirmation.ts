import { ADMIN_DELETE_NO_EMAIL_CONFIRMATION } from '@chairside/api';

/** What the admin must type to delete an account: its email, or DELETE when it has none. */
export function getAdminDeleteConfirmationPhrase(email: string | null | undefined): string {
  const trimmed = email?.trim();
  return trimmed ? trimmed : ADMIN_DELETE_NO_EMAIL_CONFIRMATION;
}

export function isAdminDeleteConfirmationMatch(
  input: string,
  email: string | null | undefined,
): boolean {
  const typed = input.trim().toLowerCase();
  if (!typed) return false;
  return typed === getAdminDeleteConfirmationPhrase(email).toLowerCase();
}
