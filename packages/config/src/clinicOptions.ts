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
  'Other',
] as const;

export type ClinicSoftware = (typeof SOFTWARE_OPTIONS)[number];

export const ROLE_TYPE_OPTIONS = [
  { value: 'hygienist' as const, label: 'Dental hygienist' },
  { value: 'assistant' as const, label: 'Dental assistant' },
  { value: 'admin' as const, label: 'Office admin' },
];

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
