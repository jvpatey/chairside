export type ClinicSpecialty =
  | 'general'
  | 'ortho'
  | 'pediatric'
  | 'periodontics'
  | 'endodontics'
  | 'oral_surgery'
  | 'other';

export const SPECIALTY_OPTIONS: { value: ClinicSpecialty; label: string }[] = [
  { value: 'general', label: 'General dentistry' },
  { value: 'ortho', label: 'Orthodontics' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'periodontics', label: 'Periodontics' },
  { value: 'endodontics', label: 'Endodontics' },
  { value: 'oral_surgery', label: 'Oral surgery' },
  { value: 'other', label: 'Other specialty' },
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
  { value: 'hygienist' as const, label: 'Dental hygienist' },
  { value: 'assistant' as const, label: 'Dental assistant' },
  { value: 'admin' as const, label: 'Office admin' },
  { value: 'office_manager' as const, label: 'Office manager' },
  { value: 'treatment_coordinator' as const, label: 'Treatment coordinator' },
  { value: 'dentist' as const, label: 'Dentist' },
  { value: 'other' as const, label: 'Other' },
] as const;

export type RoleType = (typeof ROLE_TYPE_OPTIONS)[number]['value'];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent' as const, label: 'Permanent' },
  { value: 'part-time' as const, label: 'Part-time' },
  { value: 'temp' as const, label: 'Temp' },
  { value: 'fill-in' as const, label: 'Fill-in' },
];

export const URGENCY_OPTIONS = [
  { value: 'normal' as const, label: 'Normal' },
  { value: 'urgent' as const, label: 'Urgent' },
  { value: 'same_day' as const, label: 'Same day' },
];

/** Common perks seen on the Nova Scotia Dental Association job bank. */
export const OFFERING_PRESET_OPTIONS = [
  { value: 'health_benefits', label: 'Health benefits' },
  { value: 'dental_benefits', label: 'Dental benefits' },
  { value: 'rrsp_matching', label: 'RRSP matching' },
  { value: 'paid_sick_days', label: 'Paid sick days' },
  { value: 'paid_holidays', label: 'Paid holidays (stat & non-stat)' },
  { value: 'ce_allowance', label: 'CE allowance' },
  { value: 'clothing_allowance', label: 'Clothing or scrubs allowance' },
  { value: 'free_parking', label: 'Free on-site parking' },
  { value: 'no_evenings_weekends', label: 'No evenings or weekends' },
  { value: 'signing_bonus', label: 'Signing bonus' },
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
