import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DashboardWelcomeRole } from '@/lib/dashboardWelcomeCopy';

const STORAGE_KEY_PREFIX = 'dashboard_welcome_shown_v1';
const SHOWN_VALUE = 'true';

export function getDashboardWelcomeStorageKey(
  role: DashboardWelcomeRole,
  userId: string,
): string {
  return `${STORAGE_KEY_PREFIX}_${role}_${userId}`;
}

export async function hasDashboardWelcomeBeenShown(
  role: DashboardWelcomeRole,
  userId: string,
): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(getDashboardWelcomeStorageKey(role, userId));
    return value === SHOWN_VALUE;
  } catch {
    return false;
  }
}

export async function markDashboardWelcomeShown(
  role: DashboardWelcomeRole,
  userId: string,
): Promise<void> {
  await AsyncStorage.setItem(getDashboardWelcomeStorageKey(role, userId), SHOWN_VALUE);
}

export function parseWelcomeQueryParam(
  welcome: string | string[] | undefined,
): boolean {
  const value = Array.isArray(welcome) ? welcome[0] : welcome;
  return value === '1';
}

export function shouldShowDashboardWelcome({
  welcomeParam,
  hasShown,
  isHydrated,
  userId,
}: {
  welcomeParam: string | string[] | undefined;
  hasShown: boolean;
  isHydrated: boolean;
  userId: string | null | undefined;
}): boolean {
  if (!userId || !isHydrated || hasShown) {
    return false;
  }

  return parseWelcomeQueryParam(welcomeParam);
}
