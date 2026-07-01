/** Public support contact — used on Support page and App Store Connect. */
export const SUPPORT_EMAIL = 'support@chairside.app';

/** Shown on legal pages; update when policy copy changes materially. */
export const LEGAL_LAST_UPDATED = 'July 1, 2026';

/**
 * Production web origin for absolute legal URLs (App Store Connect, email footers).
 * Set EXPO_PUBLIC_WEB_BASE_URL in production, e.g. https://chairside.app
 */
export function getPublicWebBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_BASE_URL?.trim().replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://chairside.app';
}

export const PUBLIC_LEGAL_PATHS = {
  privacy: '/privacy',
  support: '/support',
  terms: '/terms',
} as const;

export function getPublicLegalUrl(path: keyof typeof PUBLIC_LEGAL_PATHS): string {
  return `${getPublicWebBaseUrl()}${PUBLIC_LEGAL_PATHS[path]}`;
}
