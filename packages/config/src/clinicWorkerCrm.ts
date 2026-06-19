export const CLINIC_WORKER_CRM_PRESET_TAGS = [
  { value: 'strong_candidate', label: 'Strong candidate' },
  { value: 'follow_up_later', label: 'Follow up later' },
  { value: 'worked_here_before', label: 'Worked here before' },
] as const;

export type ClinicWorkerCrmPresetTag =
  (typeof CLINIC_WORKER_CRM_PRESET_TAGS)[number]['value'];

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

export function hasClinicWorkerCrmContent(record: {
  note?: string | null;
  tags?: string[] | null;
  follow_up_at?: string | null;
} | null | undefined): boolean {
  if (!record) return false;
  return Boolean(
    record.note?.trim() ||
      (record.tags?.length ?? 0) > 0 ||
      record.follow_up_at,
  );
}

export function isClinicWorkerCrmFollowUpScheduled(
  followUpAt: string | null | undefined,
): boolean {
  return Boolean(followUpAt?.trim());
}

export function isClinicWorkerCrmFollowUpDue(
  followUpAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!followUpAt?.trim()) return false;
  const date = new Date(followUpAt);
  if (Number.isNaN(date.getTime())) return false;
  return startOfDay(date).getTime() <= startOfDay(now).getTime();
}

export function formatClinicWorkerCrmFollowUpLabel(
  followUpAt: string | null | undefined,
  now: Date = new Date(),
): string | null {
  if (!followUpAt?.trim()) return null;
  const date = new Date(followUpAt);
  if (Number.isNaN(date.getTime())) return null;

  const today = startOfDay(now);
  const followUpDay = startOfDay(date);
  if (followUpDay.getTime() < today.getTime()) return 'Follow-up overdue';
  if (followUpDay.getTime() === today.getTime()) return 'Follow-up today';
  return `Follow-up ${date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })}`;
}
