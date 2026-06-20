export const CLINIC_WORKER_CRM_PRESET_TAGS = [
  { value: 'strong_candidate', label: 'Strong candidate' },
  { value: 'follow_up_later', label: 'Follow up later' },
  { value: 'worked_here_before', label: 'Worked here before' },
] as const;

export type ClinicWorkerCrmPresetTag = (typeof CLINIC_WORKER_CRM_PRESET_TAGS)[number]['value'];

const PRESET_TAG_LABELS = new Map<string, string>(
  CLINIC_WORKER_CRM_PRESET_TAGS.map((tag) => [tag.value, tag.label]),
);

export function getClinicWorkerCrmTagLabel(tag: string): string {
  return PRESET_TAG_LABELS.get(tag) ?? tag;
}

export function isClinicWorkerCrmPresetTag(tag: string): tag is ClinicWorkerCrmPresetTag {
  return PRESET_TAG_LABELS.has(tag);
}

export function normalizeClinicWorkerCrmTags(tags: string[] | null | undefined): string[] {
  if (!tags?.length) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed || !isClinicWorkerCrmPresetTag(trimmed) || seen.has(trimmed)) continue;
    seen.add(trimmed);
    normalized.push(trimmed);
  }
  return normalized;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function parseFollowUpDate(followUpAt: string | null | undefined): Date | null {
  const trimmed = followUpAt?.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hasClinicWorkerCrmContent(
  record:
    | {
        note?: string | null;
        tags?: string[] | null;
        follow_up_at?: string | null;
      }
    | null
    | undefined,
): boolean {
  if (!record) return false;
  return Boolean(
    record.note?.trim() ||
    (record.tags?.length ?? 0) > 0 ||
    isClinicWorkerCrmFollowUpScheduled(record.follow_up_at),
  );
}

export function isClinicWorkerCrmFollowUpScheduled(followUpAt: string | null | undefined): boolean {
  return parseFollowUpDate(followUpAt) != null;
}

export function isClinicWorkerCrmFollowUpDue(
  followUpAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  const date = parseFollowUpDate(followUpAt);
  if (!date) return false;
  return startOfDay(date).getTime() <= startOfDay(now).getTime();
}

export function formatClinicWorkerCrmFollowUpLabel(
  followUpAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  const date = parseFollowUpDate(followUpAt);
  if (!date) return null;

  const today = startOfDay(now);
  const followUpDay = startOfDay(date);
  if (followUpDay.getTime() < today.getTime()) return 'Follow-up overdue';
  if (followUpDay.getTime() === today.getTime()) return 'Follow-up today';
  return `Follow-up ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}
