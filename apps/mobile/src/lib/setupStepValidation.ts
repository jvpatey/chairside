import type { ClinicProfile } from '@chairside/api';
import { getWorkerRoleTypes, type WorkerProfile } from '@chairside/api';
import type { RoleType } from '@chairside/config';
import type { Href } from 'expo-router';

import type { AddressFormValue } from '@/components/clinic/AddressAutocomplete';
import {
  CLINIC_SETUP_BASICS,
  CLINIC_SETUP_LOCATION,
  CLINIC_SETUP_PRACTICE,
  WORKER_SETUP_BASICS,
  WORKER_SETUP_LOCATION,
} from '@/lib/routing';

export type SetupValidationResult = {
  ok: boolean;
  message: string | null;
};

export type ClinicSetupStepId = 'basics' | 'location' | 'practice' | 'about' | 'review';
export type WorkerSetupStepId = 'basics' | 'experience' | 'skills' | 'location' | 'review';

export function validateClinicBasicsStep(values: {
  clinicName: string;
  contactName: string;
  phone: string;
}): SetupValidationResult {
  if (!values.clinicName.trim()) {
    return { ok: false, message: 'Enter your clinic name to continue.' };
  }
  if (!values.contactName.trim() && !values.phone.trim()) {
    return { ok: false, message: 'Enter a phone number or contact name to continue.' };
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

export function validateClinicPracticeStep(softwareUsed: string[]): SetupValidationResult {
  if (softwareUsed.length === 0) {
    return { ok: false, message: 'Select at least one software system to continue.' };
  }
  return { ok: true, message: null };
}

export function validateWorkerBasicsStep(values: {
  displayName: string;
  roleTypes: RoleType[];
}): SetupValidationResult {
  if (!values.displayName.trim()) {
    return { ok: false, message: 'Enter your name to continue.' };
  }
  if (values.roleTypes.length === 0) {
    return { ok: false, message: 'Select at least one role you are qualified for.' };
  }
  return { ok: true, message: null };
}

export function isClinicBasicsComplete(profile: ClinicProfile | null): boolean {
  return validateClinicBasicsStep({
    clinicName: profile?.clinic_name ?? '',
    contactName: profile?.contact_name ?? '',
    phone: profile?.phone ?? '',
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
  displayName: string | null | undefined,
): boolean {
  return validateWorkerBasicsStep({
    displayName: displayName ?? '',
    roleTypes: getWorkerRoleTypes(profile),
  }).ok;
}

export function isWorkerLocationComplete(profile: WorkerProfile | null): boolean {
  return validateAddressStep({
    address_line1: profile?.address_line1 ?? '',
    city: profile?.city ?? '',
    postal_code: profile?.postal_code ?? '',
  }).ok;
}

export function getClinicSetupStepGuard(
  profile: ClinicProfile | null,
  step: ClinicSetupStepId,
): Href | null {
  if (step === 'basics') return null;
  if (!isClinicBasicsComplete(profile)) return CLINIC_SETUP_BASICS;
  if (step === 'location') return null;
  if (!isClinicLocationComplete(profile)) return CLINIC_SETUP_LOCATION;
  if (step === 'practice') return null;
  if (!isClinicPracticeComplete(profile)) return CLINIC_SETUP_PRACTICE;
  return null;
}

export function getWorkerSetupStepGuard(
  profile: WorkerProfile | null,
  displayName: string | null | undefined,
  step: WorkerSetupStepId,
): Href | null {
  if (step === 'basics') return null;
  if (!isWorkerBasicsComplete(profile, displayName)) return WORKER_SETUP_BASICS;
  if (step === 'experience' || step === 'skills') return null;
  if (step === 'location') return null;
  if (!isWorkerLocationComplete(profile)) return WORKER_SETUP_LOCATION;
  return null;
}
