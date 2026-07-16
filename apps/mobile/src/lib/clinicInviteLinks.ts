import { getPublicWebBaseUrl } from '@/constants/legal';

export function buildClinicManagerInviteUrl(token: string): string {
  return `${getPublicWebBaseUrl()}/accept-invite?token=${encodeURIComponent(token.trim())}`;
}

/** Parse invitation token from HTTPS, custom-scheme, or relative accept-invite URLs. */
export function parseClinicInviteTokenFromUrl(url: string): string | null {
  try {
    const normalized = url.trim();
    if (!normalized) return null;

    const withScheme =
      normalized.startsWith('http://') ||
      normalized.startsWith('https://') ||
      normalized.includes('://')
        ? normalized
        : `https://chairside.app${normalized.startsWith('/') ? '' : '/'}${normalized}`;

    const parsed = new URL(withScheme);
    // Custom schemes like chairside://accept-invite put the route in hostname.
    const path = `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '');
    if (!path.endsWith('accept-invite') && !path.includes('/accept-invite')) {
      return null;
    }

    const token = parsed.searchParams.get('token')?.trim();
    return token || null;
  } catch {
    return null;
  }
}

export function formatInviteExpiry(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
