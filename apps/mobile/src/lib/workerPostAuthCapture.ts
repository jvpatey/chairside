import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getProfile,
  getWorkerProfile,
  getWorkerRoleTypes,
  type Profile,
  type WorkerProfile,
} from '@chairside/api';
import type { Href } from 'expo-router';

export type WorkerPostAuthCaptureStep = 'name' | 'phone' | 'location';

const SKIP_KEY_PREFIX = 'chairside.workerPostAuthSkip';

function skipStorageKey(userId: string, step: 'phone' | 'location'): string {
  return `${SKIP_KEY_PREFIX}:${userId}:${step}`;
}

export function workerNeedsNameFromProfile(profile: Profile | null | undefined): boolean {
  if (profile?.role && profile.role !== 'worker') return false;
  return !profile?.first_name?.trim() && !profile?.display_name?.trim();
}

export function workerNeedsPhoneFromProfile(
  workerProfile: WorkerProfile | null | undefined,
): boolean {
  return !workerProfile?.phone?.trim();
}

/**
 * Matching basics: role type(s) + city. Province often defaults to NS in browse.
 * Same post-auth screen collects both.
 */
export function workerNeedsLocationFromProfile(
  workerProfile: WorkerProfile | null | undefined,
): boolean {
  const missingCity = !workerProfile?.city?.trim();
  const missingRoles = getWorkerRoleTypes(workerProfile).length === 0;
  return missingCity || missingRoles;
}

export async function hasSkippedWorkerPostAuthCapture(
  userId: string,
  step: 'phone' | 'location',
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(skipStorageKey(userId, step))) === '1';
  } catch {
    return false;
  }
}

export async function markWorkerPostAuthCaptureSkipped(
  userId: string,
  step: 'phone' | 'location',
): Promise<void> {
  try {
    await AsyncStorage.setItem(skipStorageKey(userId, step), '1');
  } catch {
    // Best-effort; capture can still continue.
  }
}

export async function clearWorkerPostAuthCaptureSkip(
  userId: string,
  step: 'phone' | 'location',
): Promise<void> {
  try {
    await AsyncStorage.removeItem(skipStorageKey(userId, step));
  } catch {
    // ignore
  }
}

export function getWorkerPostAuthCaptureHref(step: WorkerPostAuthCaptureStep): Href {
  switch (step) {
    case 'name':
      return '/(onboarding)/capture-name';
    case 'phone':
      return '/(onboarding)/capture-phone';
    case 'location':
      return '/(onboarding)/capture-location';
  }
}

/**
 * Next focused post-auth screen for workers missing name / phone / role+city.
 * Phone and location honor a soft "skip for now" flag until the field is saved.
 */
export async function getNextWorkerPostAuthCaptureStep(
  userId: string,
): Promise<WorkerPostAuthCaptureStep | null> {
  const profile = await getProfile(userId);
  if (profile?.role && profile.role !== 'worker') return null;

  if (workerNeedsNameFromProfile(profile)) {
    return 'name';
  }

  const workerProfile = await getWorkerProfile(userId);

  if (
    workerNeedsPhoneFromProfile(workerProfile) &&
    !(await hasSkippedWorkerPostAuthCapture(userId, 'phone'))
  ) {
    return 'phone';
  }

  if (
    workerNeedsLocationFromProfile(workerProfile) &&
    !(await hasSkippedWorkerPostAuthCapture(userId, 'location'))
  ) {
    return 'location';
  }

  return null;
}

/** @deprecated Prefer getNextWorkerPostAuthCaptureStep — kept for call-site clarity on name-only checks. */
export async function workerNeedsNameCapture(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  if (profile?.role && profile.role !== 'worker') return false;
  return workerNeedsNameFromProfile(profile);
}
