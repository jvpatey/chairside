export type PostHogClientConfig = {
  apiKey: string;
  host: string;
};

const DEFAULT_HOST = 'https://us.i.posthog.com';

/** Returns null when the public key is unset so analytics no-ops in local/dev. */
export function getPostHogConfig(): PostHogClientConfig | null {
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
  if (!apiKey) return null;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim().replace(/\/$/, '') || DEFAULT_HOST;
  return { apiKey, host };
}
