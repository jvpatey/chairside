import { usePathname, useGlobalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';

import { captureAnalyticsPageview } from '@/lib/analytics/posthog';

/** SPA pageviews for Expo Router on web. */
export function PostHogWebPageviews() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Ensure client is initialized before first pageview.
    void import('@/lib/analytics/posthogClient').then(({ getPostHogClient }) => {
      getPostHogClient();
    });
  }, []);

  useEffect(() => {
    if (!pathname) return;

    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') search.set(key, value);
      else if (Array.isArray(value) && value[0]) search.set(key, value[0]);
    }
    const query = search.toString();
    const fullPath = query ? `${pathname}?${query}` : pathname;

    if (lastPathRef.current === fullPath) return;
    lastPathRef.current = fullPath;
    captureAnalyticsPageview(fullPath);
  }, [pathname, params]);

  return null;
}
