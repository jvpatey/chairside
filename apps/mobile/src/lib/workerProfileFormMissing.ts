import { normalizePhoneForStorage } from '@chairside/config';

export type WorkerProfileFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  roleTypes: string[];
  city: string;
  province: string;
};

export type WorkerProfileFormMissing = {
  firstName: boolean;
  lastName: boolean;
  phone: boolean;
  roles: boolean;
  city: boolean;
  province: boolean;
};

export function getWorkerProfileFormMissing(
  values: WorkerProfileFormValues,
): WorkerProfileFormMissing {
  return {
    firstName: !values.firstName.trim(),
    lastName: !values.lastName.trim(),
    phone: !normalizePhoneForStorage(values.phone),
    roles: values.roleTypes.length === 0,
    city: !values.city.trim(),
    province: !values.province.trim(),
  };
}

export function listWorkerProfileFormMissingLabels(
  missing: WorkerProfileFormMissing,
): string[] {
  const labels: string[] = [];
  if (missing.phone) labels.push('mobile number');
  if (missing.roles) labels.push('role');
  if (missing.city || missing.province) labels.push('city');
  if (missing.firstName || missing.lastName) labels.push('name');
  return labels;
}

/** Banner copy — phone/SMS first when the number is missing. */
export function getWorkerProfileIncompleteBanner(missing: WorkerProfileFormMissing): {
  title: string;
  body: string;
} | null {
  const labels = listWorkerProfileFormMissingLabels(missing);
  if (labels.length === 0) return null;

  if (missing.phone) {
    return {
      title: 'Add a mobile number for text alerts',
      body: 'Fill-in openings are sent by SMS — add your phone so you don’t miss same-day cover.',
    };
  }

  return {
    title: 'Finish your profile',
    body: `Still needed: ${labels.join(', ')}. Role and city help show the right jobs nearby.`,
  };
}
