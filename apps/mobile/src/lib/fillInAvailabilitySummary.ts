import type { AvailabilityBlock, WorkerProfile } from '@chairside/api';
import { DAY_OF_WEEK_OPTIONS } from '@chairside/config';

export function isFillInAvailabilityConfigured(
  profile: WorkerProfile | null,
  blocks: AvailabilityBlock[],
): boolean {
  return Boolean(profile?.short_notice_available) && blocks.length > 0;
}

function formatScheduleDaysCompact(blocks: AvailabilityBlock[]): string {
  if (blocks.length === 0) return 'No schedule set';

  const labels = DAY_OF_WEEK_OPTIONS.filter((day) =>
    blocks.some((block) => block.day_of_week === day.value),
  ).map((day) => day.label.slice(0, 3));

  if (labels.length === 0) return 'No schedule set';
  if (labels.length <= 4) return labels.join(', ');
  return `${labels.length} days`;
}

export function getFillInAvailabilityCollapsedSummary(
  profile: WorkerProfile | null,
  blocks: AvailabilityBlock[],
): string {
  const available = profile?.short_notice_available ?? false;
  const availabilityPart = available ? 'Fill-ins: On' : 'Fill-ins: Off';
  const schedulePart = formatScheduleDaysCompact(blocks);

  if (!available) {
    return `${availabilityPart} · ${schedulePart}`;
  }

  const mode = profile?.fill_in_notification_mode ?? 'off';
  const alertShort =
    mode === 'all'
      ? 'All fill-ins'
      : mode === 'available_days_only'
        ? 'Available days only'
        : 'Alerts off';

  return `${availabilityPart} · ${schedulePart} · ${alertShort}`;
}
