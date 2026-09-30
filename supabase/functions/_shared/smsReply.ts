/** Pingram webhook timestamps older/newer than this are rejected (replay protection). */
export const WEBHOOK_TOLERANCE_MS = 5 * 60 * 1000;

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function computePingramSignature(
  secret: string,
  id: string,
  timestamp: string,
  rawBody: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`),
  );
  return toHex(signature);
}

/**
 * Verifies Pingram's `X-Pingram-Signature: v1,{hex}` header:
 * HMAC-SHA256(`{X-Pingram-Id}.{X-Pingram-Timestamp}.{rawBody}`, secret), timestamp in ms.
 */
export async function verifyPingramSignature(input: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signature: string | null;
  rawBody: string;
  nowMs?: number;
}): Promise<boolean> {
  const { secret, id, timestamp, signature, rawBody } = input;
  if (!secret || !id || !timestamp || !signature) return false;

  const timestampMs = Number(timestamp);
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs((input.nowMs ?? Date.now()) - timestampMs) > WEBHOOK_TOLERANCE_MS) return false;

  const expected = await computePingramSignature(secret, id, timestamp, rawBody);
  return signature
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .some((part) => timingSafeEqual(part.slice(3).toLowerCase(), expected));
}

export type SmsReply =
  | { kind: 'yes'; code: string | null }
  | { kind: 'help' }
  | { kind: 'unknown' };

/** Parses "YES", "yes 4821", "Y 4821", "4821 yes", "HELP". */
export function parseSmsReply(text: string): SmsReply {
  const normalized = text
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return { kind: 'unknown' };

  if (/^(HELP|INFO)\b/.test(normalized)) return { kind: 'help' };

  const words = normalized.split(' ');
  const hasYes = words.some((word) => word === 'YES' || word === 'Y' || word === 'YEP');
  if (!hasYes) return { kind: 'unknown' };

  const code = words.find((word) => /^\d{4}$/.test(word)) ?? null;
  return { kind: 'yes', code };
}

export type OpenOffer = { id: string; code: string; shift_post_id: string };

export type OfferSelection =
  | { kind: 'match'; offer: OpenOffer }
  | { kind: 'none' }
  | { kind: 'code_not_found' }
  | { kind: 'ambiguous' };

/** A bare YES only works when the worker has exactly one open offer. */
export function selectOffer(offers: OpenOffer[], code: string | null): OfferSelection {
  if (offers.length === 0) return { kind: 'none' };
  if (code) {
    const offer = offers.find((candidate) => candidate.code === code);
    return offer ? { kind: 'match', offer } : { kind: 'code_not_found' };
  }
  if (offers.length === 1) return { kind: 'match', offer: offers[0]! };
  return { kind: 'ambiguous' };
}

export type CoverRequestOutcome =
  | 'requested'
  | 'already_requested'
  | 'already_confirmed'
  | 'shift_unavailable'
  | 'not_eligible';

const APP_POINTER = 'Open the Chairside app to see open fill-ins.';

export const SMS_REPLY_COPY = {
  help: 'Chairside: reply YES and the 4-digit code from a fill-in text to request that shift. Manage alerts in the Chairside app. Reply STOP to opt out.',
  unknown: 'Chairside: to request a fill-in, reply YES and the 4-digit code from the text. Reply HELP for help or STOP to opt out.',
  disabled: `Chairside: text replies are not available right now. ${APP_POINTER}`,
  unknownSender: `Chairside: we couldn't match this number to a worker with fill-in texts on. ${APP_POINTER}`,
  noOffers: `Chairside: you have no open fill-in requests to reply to. ${APP_POINTER}`,
  codeNotFound: `Chairside: that code doesn't match an open fill-in. Check the code or ${APP_POINTER.toLowerCase()}`,
  ambiguous: 'Chairside: you have more than one open fill-in. Reply YES and the 4-digit code from the text you want.',
  error: `Chairside: something went wrong sending your request. ${APP_POINTER}`,
} as const;

export function outcomeReply(outcome: CoverRequestOutcome, clinicName: string): string {
  switch (outcome) {
    case 'requested':
      return `Chairside: request sent to ${clinicName}. You'll get a Chairside notification if they confirm you.`;
    case 'already_requested':
      return `Chairside: you've already requested this fill-in at ${clinicName}. You'll get a Chairside notification if they confirm you.`;
    case 'already_confirmed':
      return `Chairside: you're already confirmed for this fill-in at ${clinicName}. See details in the Chairside app.`;
    case 'shift_unavailable':
      return `Chairside: sorry, this fill-in at ${clinicName} is no longer available. ${APP_POINTER}`;
    case 'not_eligible':
      return `Chairside: we couldn't request this fill-in from your account. ${APP_POINTER}`;
  }
}
