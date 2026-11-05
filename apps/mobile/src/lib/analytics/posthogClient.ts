import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

import { getPostHogConfig } from './config';

let client: PostHog | null | undefined;

/** Native PostHog singleton. Null when EXPO_PUBLIC_POSTHOG_KEY is unset. */
export function getPostHogClient(): PostHog | null {
  if (client !== undefined) return client;

  const config = getPostHogConfig();
  if (!config) {
    client = null;
    return null;
  }

  client = new PostHog(config.apiKey, {
    host: config.host,
    captureAppLifecycleEvents: true,
    enableSessionReplay: true,
    sessionReplayConfig: {
      // Defaults mask text inputs and images; keep that for staffing PII.
      maskAllTextInputs: true,
      maskAllImages: true,
      captureLog: false,
    },
  });
  client.register({
    platform: Platform.OS === 'ios' ? 'ios' : 'android',
  });
  return client;
}
