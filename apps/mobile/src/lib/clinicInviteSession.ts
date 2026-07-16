import AsyncStorage from '@react-native-async-storage/async-storage';

const INVITE_TOKEN_STORAGE_KEY = 'chairside.clinicManagerInviteToken';

export function buildClinicInviteAcceptPath(token: string): string {
  return `/accept-invite?token=${encodeURIComponent(token.trim())}`;
}

export function buildClinicInviteAcceptHref(token: string): `/accept-invite?token=${string}` {
  return `/accept-invite?token=${encodeURIComponent(token.trim())}` as `/accept-invite?token=${string}`;
}

/** Persist invite token across auth flows (sign-in, OAuth, email confirm). */
export async function saveClinicInviteToken(token: string | null | undefined): Promise<void> {
  const trimmed = token?.trim();
  if (!trimmed) return;
  await AsyncStorage.setItem(INVITE_TOKEN_STORAGE_KEY, trimmed);
}

export async function readClinicInviteToken(): Promise<string | null> {
  const value = await AsyncStorage.getItem(INVITE_TOKEN_STORAGE_KEY);
  const trimmed = value?.trim();
  return trimmed || null;
}

export async function clearClinicInviteToken(): Promise<void> {
  await AsyncStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
}

export async function consumeClinicInviteToken(): Promise<string | null> {
  const token = await readClinicInviteToken();
  if (token) {
    await clearClinicInviteToken();
  }
  return token;
}
