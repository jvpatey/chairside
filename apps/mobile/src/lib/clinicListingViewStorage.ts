import AsyncStorage from '@react-native-async-storage/async-storage';

export type ClinicListingViewMode = 'cards' | 'list';
export type ClinicListingViewSurface = 'roles' | 'role-history';

export const CLINIC_LISTING_VIEW_MODES: ClinicListingViewMode[] = ['cards', 'list'];

function storageKey(
  userId: string,
  organizationId: string,
  surface: ClinicListingViewSurface,
): string {
  return `clinic_listing_view:${userId}:${organizationId}:${surface}`;
}

export function parseClinicListingViewMode(
  value: string | null | undefined,
): ClinicListingViewMode | null {
  if (value === 'cards' || value === 'list') return value;
  return null;
}

export function defaultClinicListingViewMode(isWide: boolean): ClinicListingViewMode {
  return isWide ? 'list' : 'cards';
}

export async function loadStoredClinicListingViewMode(
  userId: string,
  organizationId: string,
  surface: ClinicListingViewSurface,
): Promise<ClinicListingViewMode | null> {
  try {
    const value = await AsyncStorage.getItem(storageKey(userId, organizationId, surface));
    return parseClinicListingViewMode(value);
  } catch {
    return null;
  }
}

export async function saveStoredClinicListingViewMode(
  userId: string,
  organizationId: string,
  surface: ClinicListingViewSurface,
  mode: ClinicListingViewMode,
): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId, organizationId, surface), mode);
  } catch {
    // Ignore persistence failures; in-memory mode still works.
  }
}
