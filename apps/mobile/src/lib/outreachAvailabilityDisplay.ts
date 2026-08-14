const DAY_ORDER = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export type OutreachAvailabilitySlot = {
  day: (typeof DAY_ORDER)[number];
  dayIndex: number;
  timeLabel: string;
};

function compactClock(hours: number, minutes: string, period: string): string {
  const hour12 = hours % 12 || 12;
  return minutes === '00' ? `${hour12} ${period}` : `${hour12}:${minutes} ${period}`;
}

/** "09:00 AM-05:00 PM" → "9 AM – 5 PM"; midnight–end-of-day → "All day". */
export function compactAvailabilityTimeRange(raw: string): string {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
    raw.trim(),
  );
  if (!match) return raw.trim().replace('-', ' – ');

  const startHours = Number(match[1]);
  const startMinutes = match[2]!;
  const startPeriod = match[3]!.toUpperCase();
  const endHours = Number(match[4]);
  const endMinutes = match[5]!;
  const endPeriod = match[6]!.toUpperCase();

  if (
    startHours === 12 &&
    startMinutes === '00' &&
    startPeriod === 'AM' &&
    endHours === 11 &&
    endMinutes === '59' &&
    endPeriod === 'PM'
  ) {
    return 'All day';
  }

  return `${compactClock(startHours, startMinutes, startPeriod)} – ${compactClock(endHours, endMinutes, endPeriod)}`;
}

export function parseOutreachAvailabilitySummary(
  summary: string | null | undefined,
): OutreachAvailabilitySlot[] {
  if (!summary?.trim()) return [];

  return summary
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const match = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+(.+)$/i.exec(part);
      if (!match) return [];
      const dayRaw = match[1]!;
      const day =
        (DAY_ORDER.find((item) => item.toLowerCase() === dayRaw.toLowerCase()) ?? null);
      if (!day) return [];
      return [
        {
          day,
          dayIndex: DAY_ORDER.indexOf(day),
          timeLabel: compactAvailabilityTimeRange(match[2]!),
        },
      ];
    })
    .sort((left, right) => left.dayIndex - right.dayIndex);
}

/** Collapse consecutive days: Mon,Tue,Wed → Mon–Wed; gaps stay comma-separated. */
export function formatOutreachAvailabilityDays(slots: OutreachAvailabilitySlot[]): string {
  if (slots.length === 0) return '';

  const ranges: string[] = [];
  let rangeStart = slots[0]!;
  let rangeEnd = slots[0]!;

  const pushRange = () => {
    ranges.push(
      rangeStart.dayIndex === rangeEnd.dayIndex
        ? rangeStart.day
        : `${rangeStart.day}–${rangeEnd.day}`,
    );
  };

  for (let index = 1; index < slots.length; index += 1) {
    const slot = slots[index]!;
    if (slot.dayIndex === rangeEnd.dayIndex + 1) {
      rangeEnd = slot;
      continue;
    }
    pushRange();
    rangeStart = slot;
    rangeEnd = slot;
  }
  pushRange();

  return ranges.join(', ');
}

export type OutreachAvailabilityDisplay = {
  daysLabel: string;
  hoursLabel: string | null;
  accessibilityLabel: string;
};

/** Card-friendly availability: "Mon–Thu" + shared "9 AM – 5 PM", or days + "Varied hours". */
export function getOutreachAvailabilityDisplay(
  summary: string | null | undefined,
): OutreachAvailabilityDisplay | null {
  const slots = parseOutreachAvailabilitySummary(summary);
  if (slots.length === 0) return null;

  const daysLabel = formatOutreachAvailabilityDays(slots);
  const uniqueTimes = [...new Set(slots.map((slot) => slot.timeLabel))];
  const hoursLabel = uniqueTimes.length === 1 ? uniqueTimes[0]! : 'Varied hours';

  return {
    daysLabel,
    hoursLabel,
    accessibilityLabel:
      uniqueTimes.length === 1
        ? `Available ${daysLabel}, ${hoursLabel}`
        : `Available ${daysLabel}, varied hours`,
  };
}
