export type ClinicMissingDetail = {
  label: string;
  /** Why the detail matters, in plain language. */
  hint?: string;
};

/**
 * Field names come from `getMissingClinicProfileFields` (packages/api).
 * Address fields collapse into one "Address" row.
 */
const MISSING_FIELD_COPY: Record<string, ClinicMissingDetail> = {
  'Clinic name': {
    label: 'Clinic name',
    hint: 'Shown to professionals on every fill-in.',
  },
  Phone: {
    label: 'Phone',
    hint: 'Where professionals reach you about cover requests.',
  },
  'Street address': {
    label: 'Address',
    hint: 'Shown on your fill-ins so professionals know where to go.',
  },
  City: {
    label: 'Address',
    hint: 'Shown on your fill-ins so professionals know where to go.',
  },
  'Postal code': {
    label: 'Address',
    hint: 'Shown on your fill-ins so professionals know where to go.',
  },
  'A location with a complete address': {
    label: 'Address',
    hint: 'Add a full address to at least one clinic.',
  },
};

export function getClinicMissingDetails(missing: string[]): ClinicMissingDetail[] {
  const seen = new Set<string>();
  const details: ClinicMissingDetail[] = [];

  for (const field of missing) {
    const detail = MISSING_FIELD_COPY[field] ?? { label: field };
    if (seen.has(detail.label)) continue;
    seen.add(detail.label);
    details.push(detail);
  }

  return details;
}
