import AsyncStorage from '@react-native-async-storage/async-storage';

export type ClinicLocationScope = 'all' | string;

function storageKey(userId: string, organizationId: string): string {
  return `clinic_location_scope:${userId}:${organizationId}`;
}

export async function loadStoredLocationScope(
  userId: string,
  organizationId: string,
): Promise<ClinicLocationScope | null> {
  try {
    const value = await AsyncStorage.getItem(storageKey(userId, organizationId));
    if (!value) return null;
    return value as ClinicLocationScope;
  } catch {
    return null;
  }
}

export async function saveStoredLocationScope(
  userId: string,
  organizationId: string,
  scope: ClinicLocationScope,
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId, organizationId), scope);
  } catch {
    // Ignore persistence failures; in-memory scope still works.
  }
}
