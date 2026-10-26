import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_PUBLIC_LISTING_KEY = 'chairside.pendingPublicListingHref';

const ALLOWED_PREFIXES = ['/(tabs)/shift/', '/(tabs)/job/'] as const;

function isAllowedListingHref(href: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => href.startsWith(prefix));
}

/** Persist in-app listing path so sign-in can return to apply after auth. */
export async function savePendingPublicListingHref(
  href: string | null | undefined,
): Promise<void> {
  const trimmed = href?.trim();
  if (!trimmed || !isAllowedListingHref(trimmed)) return;
  await AsyncStorage.setItem(PENDING_PUBLIC_LISTING_KEY, trimmed);
}

export async function clearPendingPublicListingHref(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_PUBLIC_LISTING_KEY);
}

export async function consumePendingPublicListingHref(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_PUBLIC_LISTING_KEY);
  const trimmed = value?.trim() || null;
  if (trimmed) {
    await clearPendingPublicListingHref();
  }
  if (!trimmed || !isAllowedListingHref(trimmed)) return null;
  return trimmed;
}
