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

export type FillInAvailabilityCollapsedSummary = {
  primaryLabel: string;
  primary: string;
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
      secondaryLabel: 'Schedule',
      secondary: schedulePart,
    };
  }

  const mode = profile?.fill_in_notification_mode ?? 'off';
  const alertPart =
    mode === 'all'
      ? 'All fill-ins'
      : mode === 'available_days_only'
        ? 'Matching days only'
        : 'Alerts off';

  return {
    primaryLabel: 'Status',
    primary: `Available · ${alertPart}`,
    secondaryLabel: 'Schedule',
    secondary: schedulePart,
  };
}
