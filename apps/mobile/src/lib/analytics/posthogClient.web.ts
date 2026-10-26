import posthog from 'posthog-js';

import { getPostHogConfig } from './config';

let initialized = false;

type WebPostHog = typeof posthog;

/** Web PostHog singleton (posthog-js). Null when EXPO_PUBLIC_POSTHOG_KEY is unset. */
export function getPostHogClient(): WebPostHog | null {
  const config = getPostHogConfig();
  if (!config) return null;

  if (!initialized && typeof window !== 'undefined') {
    posthog.init(config.apiKey, {
      api_host: config.host,
      capture_pageview: false,
      capture_pageleave: true,
      disable_session_recording: true,
      persistence: 'localStorage+cookie',
    });
    posthog.register({ platform: 'web' });
    initialized = true;
  }

  return initialized ? posthog : null;
}
