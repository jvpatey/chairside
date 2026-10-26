/** Max characters in one GSM-7 SMS segment. Any non-GSM character switches to UCS-2 (70/segment). */
export const SMS_SEGMENT_LIMIT = 160;
/** Two-segment budget when a listing URL is included (Pingram bills per segment). */
export const SMS_TWO_SEGMENT_LIMIT = SMS_SEGMENT_LIMIT * 2;

const SMS_CLINIC_NAME_MAX = 40;

const GSM_BASIC_CHARS =
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?' +
  '¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
/** Extension-table characters cost two septets each. */
const GSM_EXTENSION_CHARS = '^{}\\[~]|€';

const GSM_CHARS = new Set([...GSM_BASIC_CHARS, ...GSM_EXTENSION_CHARS]);
const GSM_EXTENSION = new Set([...GSM_EXTENSION_CHARS]);

const GSM_REPLACEMENTS: Array<[RegExp, string]> = [
  [/[\u2018\u2019\u201A\u201B\u2032]/g, "'"],
  [/[\u201C\u201D\u201E\u201F\u2033]/g, '"'],
  [/[\u2010-\u2015\u2212]/g, '-'],
  [/[\u00B7\u2022\u2027]/g, '-'],
  [/\u2026/g, '...'],
  [/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' '],
];

/** Rewrites text so it only contains GSM-7 characters (keeps each SMS at 160 chars/segment). */
export function toGsmSafeSms(text: string): string {
  let out = text;
  for (const [pattern, replacement] of GSM_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  out = out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  out = Array.from(out)
    .filter((char) => GSM_CHARS.has(char))
    .join('');
  return out.replace(/ {2,}/g, ' ').trim();
}

/** Length in GSM-7 septets (extension characters count double). */
export function gsmLength(text: string): number {
  let length = 0;
  for (const char of text) {
    length += GSM_EXTENSION.has(char) ? 2 : 1;
  }
  return length;
}

/** First candidate that fits within maxLength after sanitizing; otherwise the last (shortest) one. */
export function fitSms(candidates: string[], maxLength = SMS_SEGMENT_LIMIT): string {
  const safe = candidates.map(toGsmSafeSms);
  return safe.find((text) => gsmLength(text) <= maxLength) ?? safe[safe.length - 1] ?? '';
}

export function formatTime12h(time: string): string | null {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) return null;

  const hours24 = Number(match[1]);
  const minutes = match[2];
  if (hours24 < 0 || hours24 > 23) return null;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return minutes === '00' ? `${hours12} ${period}` : `${hours12}:${minutes} ${period}`;
}

/** e.g. `8 AM-4 PM` (ASCII hyphen so the SMS stays GSM-7). */
export function formatSmsTimeRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined,
): string | null {
  if (!startTime || !endTime) return null;
  const start = formatTime12h(startTime);
  const end = formatTime12h(endTime);
  if (!start || !end) return null;
  return `${start}-${end}`;
}

/** e.g. `Sep 27` from `2026-09-27`. */
export function formatSmsDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return isoDate;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncateName(name: string, max = SMS_CLINIC_NAME_MAX): string {
  const trimmed = name.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function shiftDetails(input: {
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): string {
  const date = input.shiftDate?.trim() ? formatSmsDate(input.shiftDate) : null;
  const range = formatSmsTimeRange(input.startTime, input.endTime);
  const parts = [date, range].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'schedule TBD';
}

/**
 * Fill-in alert SMS. Drops location, then compensation, then shortens the clinic name to fit.
 * Never drops the brand prefix, clinic, date, call to action, or opt-out text.
 * With a listing URL, allows up to two GSM-7 segments.
 */
export function buildFillInSms(input: {
  clinicName: string;
  locationLabel: string;
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  compensation?: string | null;
  isUpdate?: boolean;
  /** When set, the call to action becomes "Reply YES {code} to request." */
  replyCode?: string | null;
  /** Public listing URL (e.g. https://chairside.app/f/{id}). Ignored when replyCode is set. */
  listingUrl?: string | null;
  /** CTA verb when listingUrl is set. Default "Apply". Use "Details" for sourced ads. */
  listingCta?: 'Apply' | 'Details' | null;
}): string {
  const verb = input.isUpdate ? 'updated' : 'posted';
  const details = shiftDetails(input);
  const compensation = input.compensation?.trim();
  const compensationPart = compensation ? ` Pay: ${compensation}.` : '';
  const location = input.locationLabel.trim();
  const listingUrl = input.listingUrl?.trim() || null;
  const listingCta = input.listingCta === 'Details' ? 'Details' : 'Apply';

  let callToAction: string;
  if (input.replyCode) {
    callToAction = `Reply YES ${input.replyCode} to request.`;
  } else if (listingUrl) {
    callToAction = `${listingCta}: ${listingUrl}`;
  } else {
    callToAction = 'Open Chairside to apply.';
  }

  const maxLength = listingUrl && !input.replyCode ? SMS_TWO_SEGMENT_LIMIT : SMS_SEGMENT_LIMIT;

  const build = (clinicName: string, withLocation: boolean, withCompensation: boolean) => {
    const locationPart = withLocation && location ? ` (${location})` : '';
    const payPart = withCompensation ? compensationPart : '';
    return `Chairside: ${clinicName}${locationPart} ${verb} a fill-in for ${details}.${payPart} ${callToAction} Reply STOP to opt out.`;
  };

  return fitSms(
    [
      build(input.clinicName, true, true),
      build(input.clinicName, false, true),
      build(input.clinicName, false, false),
      build(truncateName(input.clinicName), false, false),
    ],
    maxLength,
  );
}

/** Outreach text alert SMS (clinic messaged a worker directly about a fill-in). */
export function buildOutreachSms(input: {
  clinicName: string;
  shiftDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}): string {
  const details = input.shiftDate
    ? shiftDetails({ shiftDate: input.shiftDate, startTime: input.startTime, endTime: input.endTime })
    : '';
  const build = (clinicName: string) =>
    details
      ? `Chairside: ${clinicName} sent you a fill-in request for ${details}. Open Chairside to reply. Reply STOP to opt out.`
      : `Chairside: ${clinicName} sent you a fill-in request. Open Chairside to reply. Reply STOP to opt out.`;

  return fitSms([build(input.clinicName), build(truncateName(input.clinicName))]);
}
