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

/** Clinic role postings only — temp and fill-in use the dedicated shift flow. */
export const ROLE_EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'permanent' as const, label: 'Full Time' },
  { value: 'part-time' as const, label: 'Part Time' },
] as const;

export type RoleEmploymentType = (typeof ROLE_EMPLOYMENT_TYPE_OPTIONS)[number]['value'];

/** Map legacy role employment values to supported role-posting choices. */
export function normalizeRoleEmploymentType(employmentType: string): RoleEmploymentType {
  return employmentType === 'part-time' ? 'part-time' : 'permanent';
}

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

export function formatRoleTypesLabel(
  values: string[] | null | undefined,
  separator = ' · ',
): string {
  return (values ?? [])
    .map(getRoleTypeLabel)
    .filter(Boolean)
    .join(separator);
}

/** Resolved role list from multi-value or legacy single-value profile fields. */
export function resolveWorkerRoleTypes(profile: {
  role_types?: string[] | null;
  role_type?: string | null;
}): RoleType[] {
  if (profile.role_types?.length) {
    return profile.role_types.filter((value): value is RoleType =>
      ROLE_TYPE_OPTIONS.some((option) => option.value === value),
    );
  }

  if (
    profile.role_type &&
    ROLE_TYPE_OPTIONS.some((option) => option.value === profile.role_type)
  ) {
    return [profile.role_type as RoleType];
  }

  return [];
}

export function workerMatchesPostRole(
  profile: { role_types?: string[] | null; role_type?: string | null },
  postRoleType: string,
): boolean {
  const roles = resolveWorkerRoleTypes(profile);
  return roles.includes(postRoleType as RoleType);
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

/** Practice settings a worker may have experience in — mirrors clinic specialties. */
export const PRACTICE_TYPE_OPTIONS = SPECIALTY_OPTIONS;

export const FILL_IN_NOTIFICATION_MODE_OPTIONS = [
  { value: 'off' as const, label: 'Off' },
  { value: 'all' as const, label: 'All fill-ins in my province' },
  { value: 'available_days_only' as const, label: 'Only on my available days' },
] as const;

export type FillInNotificationMode = (typeof FILL_IN_NOTIFICATION_MODE_OPTIONS)[number]['value'];

export const TRAVEL_RADIUS_RANGE_OPTIONS = [
  { value: 'under_10' as const, label: '10 km or under' },
  { value: '10_25' as const, label: '10–25 km' },
  { value: '25_50' as const, label: '25–50 km' },
  { value: '50_75' as const, label: '50–75 km' },
  { value: '75_100' as const, label: '75–100 km' },
  { value: 'over_100' as const, label: '100 km and over' },
] as const;

export type TravelRadiusRange = (typeof TRAVEL_RADIUS_RANGE_OPTIONS)[number]['value'];

/** @deprecated Use TRAVEL_RADIUS_RANGE_OPTIONS */
export const TRAVEL_RADIUS_OPTIONS = TRAVEL_RADIUS_RANGE_OPTIONS;

export const EDUCATION_DEGREE_TYPE_OPTIONS = [
  { value: 'certificate' as const, label: 'Certificate' },
  { value: 'diploma' as const, label: 'Diploma' },
  { value: 'associate' as const, label: 'Associate degree' },
  { value: 'bachelors' as const, label: "Bachelor's degree" },
  { value: 'masters' as const, label: "Master's degree" },
  { value: 'doctorate' as const, label: 'Doctorate' },
  { value: 'other' as const, label: 'Other' },
] as const;

export type EducationDegreeType = (typeof EDUCATION_DEGREE_TYPE_OPTIONS)[number]['value'];

export const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const;

export function getFillInNotificationModeLabel(value: string): string {
  return (
    FILL_IN_NOTIFICATION_MODE_OPTIONS.find((option) => option.value === value)?.label ??
    formatDisplayLabel(value)
  );
}

export function getProvinceLabel(province: string): string {
  const labels: Record<string, string> = {
    NS: 'Nova Scotia',
    NB: 'New Brunswick',
    PE: 'Prince Edward Island',
    NL: 'Newfoundland and Labrador',
  };
  return labels[province] ?? province;
}

export function getTravelRadiusRangeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return (
    TRAVEL_RADIUS_RANGE_OPTIONS.find((option) => option.value === value)?.label ??
    formatDisplayLabel(value)
  );
}

export function travelRadiusRangeToMaxKm(value: string | null | undefined): number | null {
  switch (value) {
    case 'under_10':
      return 10;
    case '10_25':
      return 25;
    case '25_50':
      return 50;
    case '50_75':
      return 75;
    case '75_100':
      return 100;
    case 'over_100':
      return 200;
    default:
      return null;
  }
}

export function getEducationDegreeTypeLabel(value: string | null | undefined): string {
  if (!value) return '';
  return (
    EDUCATION_DEGREE_TYPE_OPTIONS.find((option) => option.value === value)?.label ??
    formatDisplayLabel(value)
  );
}

/** Format education text where the degree type may be stored as a raw value (e.g. `diploma`). */
export function formatStoredEducation(value: string | null | undefined): string {
  if (!value?.trim()) return '';

  const parts = value
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';

  const degreeType = parts[0].toLowerCase();
  parts[0] =
    getEducationDegreeTypeLabel(degreeType) ||
    getEducationDegreeTypeLabel(parts[0]) ||
    formatDisplayLabel(parts[0]);

  return parts.join(' · ');
}

export function formatWorkerEducation(input: {
  education?: string | null;
  education_graduation_year?: number | null;
  education_degree_type?: string | null;
  education_field?: string | null;
  education_institution?: string | null;
}): string {
  const parts = [
    getEducationDegreeTypeLabel(input.education_degree_type),
    input.education_field?.trim(),
    input.education_institution?.trim(),
    input.education_graduation_year != null ? String(input.education_graduation_year) : null,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(' · ');
  return formatStoredEducation(input.education);
}

export function formatWorkerAddress(input: {
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
}): string {
  const parts = [
    input.city?.trim(),
    input.province ? getProvinceLabel(input.province) : null,
  ].filter(Boolean);

  return parts.join(', ');
}
