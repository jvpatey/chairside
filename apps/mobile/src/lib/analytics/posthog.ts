import { getPostHogClient } from './posthogClient';

type Properties = Record<string, string | number | boolean | null | undefined>;

function sanitizeProperties(properties?: Properties): Record<string, string | number | boolean | null> | undefined {
  if (!properties) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

export function captureAnalyticsEvent(event: string, properties?: Properties): void {
  const client = getPostHogClient();
  if (!client) return;
  client.capture(event, sanitizeProperties(properties));
}

export function identifyAnalyticsUser(
  userId: string,
  properties?: Properties,
): void {
  const client = getPostHogClient();
  if (!client) return;
  client.identify(userId, sanitizeProperties(properties));
}

export function resetAnalyticsUser(): void {
  const client = getPostHogClient();
  if (!client) return;
  client.reset();
}

export function captureAnalyticsPageview(pathname: string): void {
  const client = getPostHogClient();
  if (!client) return;
  if ('capture_pageview' in client || typeof (client as { capture?: unknown }).capture === 'function') {
    client.capture('$pageview', { $current_url: pathname });
  }
}
