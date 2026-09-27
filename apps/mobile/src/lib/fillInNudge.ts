import type { WorkerProfile } from '@chairside/api';

import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';

export type FillInNudgeState = 'fill_ins_off' | 'texts_off';

export type FillInNudgeSnooze = {
  state: FillInNudgeState;
  snoozedAt: number;
};

export const FILL_IN_NUDGE_SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

export function getFillInNudgeState(profile: WorkerProfile | null): FillInNudgeState | null {
  if (!profile) return null;
  const fillInsOn =
    Boolean(profile.short_notice_available) &&
    (profile.fill_in_notification_mode ?? 'off') !== 'off';
  if (!fillInsOn) return 'fill_ins_off';
  if (!getFillInSmsStatus(profile).smsActive) return 'texts_off';
  return null;
}

/** A snooze only applies to the state it was dismissed in, and expires after 14 days. */
export function shouldShowFillInNudge(
  state: FillInNudgeState | null,
  snooze: FillInNudgeSnooze | null,
  now: number,
): boolean {
  if (!state) return false;
  if (!snooze || snooze.state !== state) return true;
  return now - snooze.snoozedAt >= FILL_IN_NUDGE_SNOOZE_MS;
}

export function parseFillInNudgeSnooze(raw: string | null): FillInNudgeSnooze | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<FillInNudgeSnooze>;
    if (
      (parsed.state === 'fill_ins_off' || parsed.state === 'texts_off') &&
      typeof parsed.snoozedAt === 'number'
    ) {
      return { state: parsed.state, snoozedAt: parsed.snoozedAt };
    }
  } catch {
    return null;
  }
  return null;
}

export function getFillInNudgeSnoozeKey(userId: string): string {
  return `chairside.fillInNudge.snooze.v1.${userId}`;
}
