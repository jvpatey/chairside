import type { Href } from 'expo-router';

import { isNotificationTabRootRoute, normalizeNotificationRoute } from '@/lib/routing';

/** Map chairside:// deep links from notifications to Expo Router paths. */
export function resolveNotificationDeepLink(url: string | undefined | null): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/')) return trimmed;
  if (trimmed.startsWith('chairside://')) {
    const path = trimmed.replace(/^chairside:\/\//, '');
    return path.startsWith('/') ? path : `/${path}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'chairside:') {
      const path = `/${parsed.host}${parsed.pathname}`.replace(/\/+/g, '/');
      return path === '/' ? null : path;
    }
  } catch {
    return null;
  }
  return null;
}

export function navigateToNotificationDeepLink(
  router: { push: (href: Href) => void; replace: (href: Href) => void },
  url: string | undefined | null,
): boolean {
  const resolved = resolveNotificationDeepLink(url);
  if (!resolved) return false;

  const path = normalizeNotificationRoute(resolved);
  const href = path as Href;
  if (isNotificationTabRootRoute(path)) {
    router.replace(href);
  } else {
    router.push(href);
  }
  return true;
}
