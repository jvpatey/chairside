export type ClinicSpecialty =
  | 'general'
  | 'ortho'
  | 'pediatric'
  | 'periodontics'
  | 'endodontics'
  | 'oral_surgery'
  | 'other';

export const SPECIALTY_OPTIONS: { value: ClinicSpecialty; label: string }[] = [
  { value: 'general', label: 'General Dentistry' },
  { value: 'ortho', label: 'Orthodontics' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'periodontics', label: 'Periodontics' },
  { value: 'endodontics', label: 'Endodontics' },
  { value: 'oral_surgery', label: 'Oral Surgery' },
  { value: 'other', label: 'Other Specialty' },
];

export const SOFTWARE_OPTIONS = [
  'Dentrix',
  'AbelDent',
  'Cleardent',
  'Open Dental',
  'Curve Dental',
  'Tracker',
  'Power Practice',
  'None',
  'Other',
] as const;

export type ClinicSoftware = (typeof SOFTWARE_OPTIONS)[number];

/** "None" cannot be combined with other software selections. */
export function resolveSoftwareSelection(current: string[], next: string[]): string[] {
  const selectedNone = next.includes('None') && !current.includes('None');
  if (selectedNone) return ['None'];
  if (next.includes('None') && next.length > 1) {
    return next.filter((item) => item !== 'None');
  }
  return next;
}

export const ROLE_TYPE_OPTIONS = [
  { value: 'hygienist' as const, label: 'Dental Hygienist' },
  { value: 'assistant' as const, label: 'Dental Assistant' },
  { value: 'admin' as const, label: 'Office Admin' },
  { value: 'office_manager' as const, label: 'Office Manager' },
  { value: 'treatment_coordinator' as const, label: 'Treatment Coordinator' },
  { value: 'dentist' as const, label: 'Dentist' },
  { value: 'other' as const, label: 'Other' },
] as const;

export type RoleType = (typeof ROLE_TYPE_OPTIONS)[number]['value'];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent' as const, label: 'Full Time' },
  { value: 'part-time' as const, label: 'Part Time' },
  { value: 'temp' as const, label: 'Temp' },
  { value: 'fill-in' as const, label: 'Fill-In' },
];

export const URGENCY_OPTIONS = [
  { value: 'normal' as const, label: 'Normal' },
  { value: 'urgent' as const, label: 'Urgent' },
  { value: 'same_day' as const, label: 'Same Day' },
];

/** Common perks seen on the Nova Scotia Dental Association job bank. */
export const OFFERING_PRESET_OPTIONS = [
  { value: 'health_benefits', label: 'Health Benefits' },
  { value: 'dental_benefits', label: 'Dental Benefits' },
  { value: 'rrsp_matching', label: 'RRSP Matching' },
  { value: 'paid_sick_days', label: 'Paid Sick Days' },
  { value: 'paid_holidays', label: 'Paid Holidays (Stat & Non-Stat)' },
  { value: 'ce_allowance', label: 'CE Allowance' },
  { value: 'clothing_allowance', label: 'Clothing or Scrubs Allowance' },
  { value: 'free_parking', label: 'Free On-Site Parking' },
  { value: 'no_evenings_weekends', label: 'No Evenings or Weekends' },
  { value: 'signing_bonus', label: 'Signing Bonus' },
] as const;

export type OfferingPreset = (typeof OFFERING_PRESET_OPTIONS)[number]['value'];

export function getOfferingPresetLabel(value: OfferingPreset): string {
  return OFFERING_PRESET_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export type TeamSizeRange = '1-5' | '6-10' | '11-20' | '21-50' | '51+' | 'prefer_not_to_say';

export const TEAM_SIZE_RANGE_OPTIONS: { value: TeamSizeRange; label: string }[] = [
  { value: '1-5', label: '1–5 people' },
  { value: '6-10', label: '6–10 people' },
  { value: '11-20', label: '11–20 people' },
  { value: '21-50', label: '21–50 people' },
  { value: '51+', label: '51+ people' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export function getTeamSizeRangeLabel(value: TeamSizeRange | null | undefined): string | null {
  if (!value) return null;
  return TEAM_SIZE_RANGE_OPTIONS.find((option) => option.value === value)?.label ?? null;
}

export type JobPostStatus = 'live' | 'paused' | 'filled' | 'closed';

export type JobPostStatusBadgeVariant = 'live' | 'paused' | 'filled' | 'archived' | 'neutral';

export const JOB_POST_STATUS_OPTIONS: {
  value: JobPostStatus;
  label: string;
  badgeVariant: JobPostStatusBadgeVariant;
}[] = [
  { value: 'live', label: 'Live', badgeVariant: 'live' },
  { value: 'paused', label: 'Paused', badgeVariant: 'paused' },
  { value: 'filled', label: 'Filled', badgeVariant: 'filled' },
  { value: 'closed', label: 'Archived', badgeVariant: 'archived' },
];

export function getJobPostStatusLabel(status: JobPostStatus): string {
  return JOB_POST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

export function getJobPostStatusBadgeVariant(status: JobPostStatus): JobPostStatusBadgeVariant {
  return (
    JOB_POST_STATUS_OPTIONS.find((option) => option.value === status)?.badgeVariant ?? 'neutral'
  );
}

/** Title-case fallback for raw stored values (e.g. `part-time` → `Part Time`). */
export function formatDisplayLabel(value: string): string {
  return value
    .trim()
    .replace(/[_-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getRoleTypeLabel(value: string): string {
  return ROLE_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? formatDisplayLabel(value);
}

export function getEmploymentTypeLabel(value: string): string {
  return (
    EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    formatDisplayLabel(value)
  );
}

export function getSpecialtyLabel(value: string): string {
  return SPECIALTY_OPTIONS.find((option) => option.value === value)?.label ?? formatDisplayLabel(value);
}

export function getUrgencyLabel(value: string): string {
  return URGENCY_OPTIONS.find((option) => option.value === value)?.label ?? formatDisplayLabel(value);
}

export function formatOfferingLabel(value: string): string {
  const normalized = value.trim().toLowerCase();
  const preset = OFFERING_PRESET_OPTIONS.find(
    (option) =>
      option.value === value ||
      option.label.toLowerCase() === normalized ||
      formatDisplayLabel(option.label).toLowerCase() === normalized,
  );
  if (preset) return preset.label;
  return formatDisplayLabel(value);
}

export function formatJobPostRoleMeta(job: {
  role_type: string;
  employment_type: string;
}): string {
  return `${getRoleTypeLabel(job.role_type)} · ${getEmploymentTypeLabel(job.employment_type)}`;
}

export function formatJobPostCardMeta(job: {
  role_type: string;
  employment_type: string;
  specialty?: string | null;
}): string {
  const parts = [formatJobPostRoleMeta(job), job.specialty ? getSpecialtyLabel(job.specialty) : null].filter(
    Boolean,
  );
  return parts.join(' · ');
}
