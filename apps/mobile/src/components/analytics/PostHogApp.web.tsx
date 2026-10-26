import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { PostHogIdentify } from '@/components/analytics/PostHogIdentify';
import { PostHogWebPageviews } from '@/components/analytics/PostHogWebPageviews';
import { getPostHogClient } from '@/lib/analytics/posthogClient';

/** Web PostHog bootstrap (posthog-js) + SPA pageviews + identify. */
export function PostHogApp({ children }: { children: ReactNode }) {
  useEffect(() => {
    getPostHogClient();
  }, []);

  return (
    <>
      <PostHogWebPageviews />
      <PostHogIdentify />
      {children}
    </>
  );
}
