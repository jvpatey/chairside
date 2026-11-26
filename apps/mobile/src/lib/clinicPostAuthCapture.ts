import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getClinicProfile,
  getProfile,
  type ClinicProfile,
  type Profile,
} from '@chairside/api';
import type { Href } from 'expo-router';

export type ClinicPostAuthCaptureStep = 'clinic-name' | 'phone' | 'address';

const SKIP_KEY_PREFIX = 'chairside.clinicPostAuthSkip';

function skipStorageKey(userId: string, step: 'phone' | 'address'): string {
  return `${SKIP_KEY_PREFIX}:${userId}:${step}`;
}

export function clinicNeedsNameFromProfile(
  clinicProfile: ClinicProfile | null | undefined,
): boolean {
  const name = clinicProfile?.clinic_name?.trim() ?? '';
  if (!name) return true;
  // Ignore bootstrap placeholders left from account-type / org stubs.
  return name.toLowerCase() === 'clinic';
}

export function clinicNeedsPhoneFromProfile(
  clinicProfile: ClinicProfile | null | undefined,
): boolean {
  return !clinicProfile?.phone?.trim();
}

export function clinicNeedsAddressFromProfile(
  clinicProfile: ClinicProfile | null | undefined,
): boolean {
  return (
    !clinicProfile?.address_line1?.trim() ||
    !clinicProfile?.city?.trim() ||
    !clinicProfile?.postal_code?.trim()
  );
}

export async function hasSkippedClinicPostAuthCapture(
  userId: string,
  step: 'phone' | 'address',
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(skipStorageKey(userId, step))) === '1';
  } catch {
    return false;
  }
}

export async function markClinicPostAuthCaptureSkipped(
  userId: string,
  step: 'phone' | 'address',
): Promise<void> {
  try {
    await AsyncStorage.setItem(skipStorageKey(userId, step), '1');
  } catch {
    // Best-effort
  }
}

export async function clearClinicPostAuthCaptureSkip(
  userId: string,
  step: 'phone' | 'address',
): Promise<void> {
  try {
    await AsyncStorage.removeItem(skipStorageKey(userId, step));
  } catch {
    // ignore
  }
}

export function getClinicPostAuthCaptureHref(step: ClinicPostAuthCaptureStep): Href {
  switch (step) {
    case 'clinic-name':
      return '/(onboarding)/capture-clinic-name';
    case 'phone':
      return '/(onboarding)/capture-clinic-phone';
    case 'address':
      return '/(onboarding)/capture-clinic-address';
  }
}

/**
 * Next focused post-auth screen for clinics missing name / phone / address.
 * Phone and address honor a soft "skip for now" until posting requires them.
 */
export async function getNextClinicPostAuthCaptureStep(
  userId: string,
): Promise<ClinicPostAuthCaptureStep | null> {
  const profile = await getProfile(userId);
  if (profile?.role && profile.role !== 'clinic') return null;

  const clinicProfile = await getClinicProfile(userId);

  if (clinicNeedsNameFromProfile(clinicProfile)) {
    return 'clinic-name';
  }

  if (
    clinicNeedsPhoneFromProfile(clinicProfile) &&
    !(await hasSkippedClinicPostAuthCapture(userId, 'phone'))
  ) {
    return 'phone';
  }

  if (
    clinicNeedsAddressFromProfile(clinicProfile) &&
    !(await hasSkippedClinicPostAuthCapture(userId, 'address'))
  ) {
    return 'address';
  }

  return null;
}

/** Kept for typing convenience at call sites. */
export type ClinicPostAuthProfile = Profile;
