export const DEFAULT_PINGRAM_API_URL = 'https://api.ca.pingram.io';

const PINGRAM_TIMEOUT_MS = 10_000;
/** Only statuses where Pingram did not accept the message, so a retry cannot double-send. */
const PINGRAM_RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);

export function maskPhone(phone: string): string {
  return phone.length > 4 ? `***${phone.slice(-4)}` : '***';
}

export function normalizeE164(phone: string | null | undefined): string | null {
  if (!phone?.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return null;
}

/** POSTs to Pingram and returns the tracking id (if any). */
export async function pingramPost(
  apiKey: string,
  apiBase: string,
  path: '/sms' | '/email',
  body: Record<string, unknown>,
): Promise<string | null> {
  if (!apiKey.trim()) {
    throw new Error('PINGRAM_API_KEY not configured');
  }
  const url = `${apiBase.replace(/\/$/, '')}${path}`;
  const init = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  let res = await fetch(url, { ...init, signal: AbortSignal.timeout(PINGRAM_TIMEOUT_MS) });
  if (PINGRAM_RETRYABLE_STATUSES.has(res.status)) {
    await res.body?.cancel();
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(PINGRAM_TIMEOUT_MS) });
  }

  if (!res.ok) {
    const text = await res.text();
    const regionHint =
      res.status === 401 || res.status === 403
        ? ` (check PINGRAM_API_URL matches the key's region; using ${apiBase})`
        : '';
    throw new Error(`Pingram ${path} failed (${res.status})${regionHint}: ${text}`);
  }

  const json = (await res.json().catch(() => null)) as { trackingId?: string } | null;
  return typeof json?.trackingId === 'string' ? json.trackingId : null;
}
