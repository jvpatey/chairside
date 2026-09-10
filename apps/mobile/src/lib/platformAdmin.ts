/** Client-side visibility helper for platform admin UI. Server ADMIN_EMAILS is authoritative. */
const PLATFORM_ADMIN_EMAILS = new Set(['jeffreyvpatey@gmail.com']);

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return PLATFORM_ADMIN_EMAILS.has(email.trim().toLowerCase());
}
