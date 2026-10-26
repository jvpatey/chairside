import type { ReactNode } from 'react';
import { PostHogProvider } from 'posthog-react-native';

import { PostHogIdentify } from '@/components/analytics/PostHogIdentify';
import { getPostHogClient } from '@/lib/analytics/posthogClient';

/** Native PostHog provider + identify. No-ops when the public key is unset. */
export function PostHogApp({ children }: { children: ReactNode }) {
  const client = getPostHogClient();

  if (!client) {
    return (
      <>
        <PostHogIdentify />
        {children}
      </>
    );
  }

  return (
    <PostHogProvider
      client={client}
      style={{ flex: 1 }}
      autocapture={{
        captureTouches: false,
        captureScreens: true,
      }}>
      <PostHogIdentify />
      {children}
    </PostHogProvider>
  );
}
