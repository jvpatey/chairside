import type { Href } from 'expo-router';

import { resolveNotificationDeepLink } from '@/lib/pingram';
import { isNotificationTabRootRoute, normalizeNotificationRoute } from '@/lib/routing';

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
