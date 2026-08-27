import { isPastShiftDate } from '@/lib/fillInFilters';

export type FillInHistoryAudience = 'worker' | 'clinic';

export function formatFilledInTitle(
  name: string | null | undefined,
  audience: FillInHistoryAudience,
): string {
  const trimmed = name?.trim() ?? '';
  if (audience === 'worker') {
    return trimmed ? `Filled in at ${trimmed}` : 'Filled in';
  }
  return trimmed ? `${trimmed} filled in` : 'Filled in';
}

export function formatConfirmedFillInKindLabel(isPast: boolean): string {
  return isPast ? 'Filled in' : 'Confirmed fill-in';
}

export function formatConfirmedFillInStatusLabel(isPast: boolean): string {
  return isPast ? 'Filled in' : 'Confirmed';
}

export function formatConfirmedFillInHeadline(isPast: boolean): string {
  return isPast ? 'Filled in' : 'Fill-in confirmed';
}

export function formatConfirmedFillInDescription(
  audience: FillInHistoryAudience,
  isPast: boolean,
  counterpartName?: string | null,
): string {
  if (!isPast) {
    return audience === 'worker'
      ? 'This fill-in was confirmed.'
      : 'This candidate was confirmed for the fill-in.';
  }

  if (audience === 'worker') {
    return 'You filled in on this day.';
  }

  const name = counterpartName?.trim();
  return name ? `${name} filled in on this day.` : 'This candidate filled in on this day.';
}

export function getConfirmedFillInCardCopy(input: {
  counterpartName: string | null | undefined;
  audience: FillInHistoryAudience;
  isPast: boolean;
}): { eyebrow: string; title: string } {
  const name = input.counterpartName?.trim() || '';
  if (!input.isPast) {
    return {
      eyebrow: formatConfirmedFillInKindLabel(false),
      title: name,
    };
  }

  return {
    eyebrow: formatConfirmedFillInKindLabel(true),
    title: formatFilledInTitle(name, input.audience),
  };
}

export function resolveConfirmedFillInStatusLabel(input: {
  status: string | null | undefined;
  shiftDate?: string | null;
}): string | null {
  if (input.status !== 'hired' && input.status !== 'selected') return null;
  if (!isPastShiftDate(input.shiftDate)) return null;
  return formatConfirmedFillInStatusLabel(true);
}
