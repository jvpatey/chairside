import type { ClinicProfile } from '@chairside/api';
import { getWorkerRoleTypes, type WorkerProfile } from '@chairside/api';
import { normalizePhoneForStorage, type RoleType } from '@chairside/config';
import type { Href } from 'expo-router';

import type { AddressFormValue } from '@/components/clinic/AddressAutocomplete';
import {
  CLINIC_SETUP_BASICS,
  CLINIC_SETUP_LOCATION,
  WORKER_SETUP_BASICS,
  WORKER_SETUP_LOCATION,
} from '@/lib/routing';

export type SetupValidationResult = {
  ok: boolean;
  message: string | null;
};

export type ClinicSetupStepId = 'basics' | 'location' | 'practice' | 'about' | 'review';
export type WorkerSetupStepId = 'basics' | 'location' | 'fill-ins' | 'review';

export function validateClinicBasicsStep(values: {
  clinicName: string;
  contactName: string;
  phone: string;
  /** Groups may satisfy contact via org phone or contact name. */
  isGroup?: boolean;
}): SetupValidationResult {
  if (!values.clinicName.trim()) {
    return { ok: false, message: 'Enter your clinic name to continue.' };
  }
  if (values.isGroup) {
    if (!values.contactName.trim() && !values.phone.trim()) {
      return { ok: false, message: 'Enter a phone number or contact name to continue.' };
    }
    return { ok: true, message: null };
  }
  if (!normalizePhoneForStorage(values.phone)) {
    return { ok: false, message: 'Enter a clinic phone number to continue.' };
  }
  return { ok: true, message: null };
}

export function validateAddressStep(
  address: Pick<AddressFormValue, 'address_line1' | 'city' | 'postal_code'>,
): SetupValidationResult {
  if (!address.address_line1.trim() || !address.city.trim() || !address.postal_code.trim()) {
    return { ok: false, message: 'Enter a complete address to continue.' };
  }
  return { ok: true, message: null };
}

/** Worker place for SMS matching — city + province only. */
export function validateWorkerPlaceStep(
  address: Pick<AddressFormValue, 'city' | 'province'>,
): SetupValidationResult {
  if (!address.city.trim()) {
    return { ok: false, message: 'Enter your city to continue.' };
  }
  if (!address.province.trim()) {
    return { ok: false, message: 'Select your province to continue.' };
  }
  return { ok: true, message: null };
}

export function validateClinicPracticeStep(softwareUsed: string[]): SetupValidationResult {
  if (softwareUsed.length === 0) {
    return { ok: false, message: 'Select at least one software system to continue.' };
  }
  return { ok: true, message: null };
}

export function validateWorkerBasicsStep(values: {
  firstName: string;
  lastName: string;
  roleTypes: RoleType[];
  phone: string;
}): SetupValidationResult {
  if (!values.firstName.trim() || !values.lastName.trim()) {
    return { ok: false, message: 'Enter your first and last name.' };
  }
  if (values.roleTypes.length === 0) {
    return { ok: false, message: 'Select at least one role you are qualified for.' };
  }
  if (!normalizePhoneForStorage(values.phone)) {
    return { ok: false, message: 'Enter a 10-digit mobile number for fill-in texts.' };
  }
  return { ok: true, message: null };
}

export function isClinicBasicsComplete(profile: ClinicProfile | null): boolean {
  const isGroup = profile?.account_type === 'group';
  return validateClinicBasicsStep({
    clinicName: profile?.clinic_name ?? '',
    contactName: profile?.contact_name ?? '',
    phone: profile?.phone ?? '',
    isGroup,
  }).ok;
}

export function isClinicLocationComplete(profile: ClinicProfile | null): boolean {
  return validateAddressStep({
    address_line1: profile?.address_line1 ?? '',
    city: profile?.city ?? '',
    postal_code: profile?.postal_code ?? '',
  }).ok;
}

export function isClinicPracticeComplete(profile: ClinicProfile | null): boolean {
  return validateClinicPracticeStep(profile?.software_used ?? []).ok;
}

export function isWorkerBasicsComplete(
  profile: WorkerProfile | null,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): boolean {
  return validateWorkerBasicsStep({
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    roleTypes: getWorkerRoleTypes(profile),
    phone: profile?.phone ?? '',
  }).ok;
}

export function isWorkerLocationComplete(profile: WorkerProfile | null): boolean {
  return validateWorkerPlaceStep({
    city: profile?.city ?? '',
    province: profile?.province ?? '',
  }).ok;
}

export function getClinicSetupStepGuard(
  profile: ClinicProfile | null,
  step: ClinicSetupStepId,
): Href | null {
  if (step === 'basics') return null;
  if (!isClinicBasicsComplete(profile)) return CLINIC_SETUP_BASICS;

  // Group addresses live on clinic_locations, not the org profile row.
  if (profile?.account_type === 'group') return null;

  if (step === 'location') return null;
  if (!isClinicLocationComplete(profile)) return CLINIC_SETUP_LOCATION;
  return null;
}

export function getWorkerSetupStepGuard(
  profile: WorkerProfile | null,
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  step: WorkerSetupStepId,
): Href | null {
  if (step === 'basics') return null;
  if (!isWorkerBasicsComplete(profile, firstName, lastName)) return WORKER_SETUP_BASICS;
  if (step === 'location') return null;
  if (!isWorkerLocationComplete(profile)) return WORKER_SETUP_LOCATION;
  return null;
}
