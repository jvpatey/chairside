/** Server-side PostHog capture for edge functions. No-ops when POSTHOG_API_KEY is unset. */

const DEFAULT_HOST = 'https://us.i.posthog.com';

type CaptureInput = {
  distinctId: string;
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
};

function getPosthogConfig(): { apiKey: string; host: string } | null {
  const apiKey = Deno.env.get('POSTHOG_API_KEY')?.trim();
  if (!apiKey) return null;
  const host = (Deno.env.get('POSTHOG_HOST')?.trim() || DEFAULT_HOST).replace(/\/$/, '');
  return { apiKey, host };
}

function sanitizeProperties(
  properties?: CaptureInput['properties'],
): Record<string, string | number | boolean | null> | undefined {
  if (!properties) return undefined;
  const out: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined) continue;
    out[key] = value;
  }
  return out;
}

/** Fire-and-forget capture. Never throws; failures are logged. */
export async function capturePosthogEvent(input: CaptureInput): Promise<void> {
  const config = getPosthogConfig();
  if (!config) return;

  const distinctId = input.distinctId.trim();
  if (!distinctId) return;

  try {
    const response = await fetch(`${config.host}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.apiKey,
        event: input.event,
        distinct_id: distinctId,
        properties: {
          ...sanitizeProperties(input.properties),
          $lib: 'chairside-edge',
        },
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.warn(
        `[posthog] capture failed event=${input.event} status=${response.status} ${text.slice(0, 200)}`,
      );
    }
  } catch (error) {
    console.warn(`[posthog] capture error event=${input.event}`, error);
  }
}
