import type { AvailabilityBlock, WorkerProfile } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';

import { formatAvailabilityTimeRange } from '@/lib/availabilitySchedule';

export function isFillInAvailabilityConfigured(
  profile: WorkerProfile | null,
  blocks: AvailabilityBlock[],
): boolean {
  return Boolean(profile?.short_notice_available) && blocks.length > 0;
}

export type FillInSmsStatus = {
  fillInsOn: boolean;
  smsActive: boolean;
  smsNeedsPhone: boolean;
};

/** Effective fill-in SMS state for summary badges and subtitles. */
export function getFillInSmsStatus(profile: WorkerProfile | null): FillInSmsStatus {
  const fillInsOn = profile?.short_notice_available ?? false;
  const optedIn = profile?.fill_in_sms_opt_in ?? false;
  const hasPhone = Boolean(profile?.phone?.trim());
  return {
    fillInsOn,
    smsActive: fillInsOn && optedIn && hasPhone,
    smsNeedsPhone: fillInsOn && optedIn && !hasPhone,
  };
}

export function getFillInSmsSubtitlePart(profile: WorkerProfile | null): string | null {
  const { fillInsOn, smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  if (!fillInsOn) return null;
  if (smsActive) return 'Texts: On';
  if (smsNeedsPhone) return 'Texts: Needs phone';
  return 'Texts: Off';
}

export type FillInSmsBadgeTone = 'on' | 'off' | 'needs_phone';

export type FillInSmsBadgePresentation = {
  tone: FillInSmsBadgeTone;
  label: string;
  showDot: boolean;
};

/** Badge copy + tone when fill-ins are on. Null when fill-ins are off. */
export function getFillInSmsBadgePresentation(
  profile: WorkerProfile | null,
): FillInSmsBadgePresentation | null {
  const { fillInsOn, smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  if (!fillInsOn) return null;
  if (smsActive) {
    return { tone: 'on', label: 'Text alerts on', showDot: true };
  }
  if (smsNeedsPhone) {
    return { tone: 'needs_phone', label: 'Add phone for texts', showDot: false };
  }
  return { tone: 'off', label: 'Text alerts off', showDot: false };
}

function formatScheduleDaysCompact(blocks: AvailabilityBlock[]): string {
  if (blocks.length === 0) return 'No schedule set';

  const entries = DAY_OF_WEEK_OPTIONS.filter((day) =>
    blocks.some((block) => block.day_of_week === day.value),
  ).map((day) => {
    const block = blocks.find((item) => item.day_of_week === day.value);
    if (!block) return null;
    const timeRange = formatAvailabilityTimeRange(block.start_time, block.end_time);
    return `${day.label.slice(0, 3)} ${timeRange}`;
  }).filter(Boolean) as string[];

  if (entries.length === 0) return 'No schedule set';
  if (entries.length <= 3) return entries.join(', ');
  return `${entries.length} days set`;
}

export type FillInAvailabilityStatusSegment = {
  text: string;
  tone: 'positive' | 'negative' | 'default';
};

export type FillInAvailabilityCollapsedSummary = {
  primaryLabel: string;
  primary: string;
  primaryTone: 'positive' | 'negative';
  primarySegments: FillInAvailabilityStatusSegment[];
  secondaryLabel: string;
  secondary: string;
};

export function getFillInAvailabilityCollapsedSummary(
  profile: WorkerProfile | null,
  blocks: AvailabilityBlock[],
): FillInAvailabilityCollapsedSummary {
  const available = profile?.short_notice_available ?? false;
  const schedulePart = formatScheduleDaysCompact(blocks);

  if (!available) {
    return {
      primaryLabel: 'Status',
      primary: 'Not available',
      primaryTone: 'negative',
      primarySegments: [{ text: 'Not available', tone: 'negative' }],
      secondaryLabel: 'Schedule',
      secondary: schedulePart,
    };
  }

  const { smsActive, smsNeedsPhone } = getFillInSmsStatus(profile);
  const textsPart = smsActive
    ? 'Texts on'
    : smsNeedsPhone
      ? 'Needs phone'
      : 'Texts off';
  const primarySegments: FillInAvailabilityStatusSegment[] = [
    { text: 'Open to fill-ins', tone: 'positive' },
    {
      text: textsPart,
      tone: smsActive ? 'positive' : 'negative',
    },
  ];

  return {
    primaryLabel: 'Status',
    primary: primarySegments.map((segment) => segment.text).join(' · '),
    primaryTone: 'positive',
    primarySegments,
    secondaryLabel: 'Schedule',
    secondary: schedulePart,
  };
}
