import AsyncStorage from '@react-native-async-storage/async-storage';

import type { UserRole } from '@/types';

const PENDING_SIGNUP_ROLE_KEY = 'chairside.pendingSignupRole';

function parseRole(value: string | null | undefined): UserRole | null {
  return value === 'worker' || value === 'clinic' ? value : null;
}

/** Persist pre-auth role choice across OAuth redirects and email confirmation. */
export async function savePendingSignupRole(role: UserRole | null | undefined): Promise<void> {
  const parsed = parseRole(role ?? null);
  if (!parsed) return;
  await AsyncStorage.setItem(PENDING_SIGNUP_ROLE_KEY, parsed);
}

export async function readPendingSignupRole(): Promise<UserRole | null> {
  const value = await AsyncStorage.getItem(PENDING_SIGNUP_ROLE_KEY);
  return parseRole(value);
}

export async function clearPendingSignupRole(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_SIGNUP_ROLE_KEY);
}

export async function consumePendingSignupRole(): Promise<UserRole | null> {
  const role = await readPendingSignupRole();
  if (role) {
    await clearPendingSignupRole();
  }
  return role;
}
