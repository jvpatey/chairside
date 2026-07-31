import type { PersonNameParts } from './authDisplayName';

const KEY_PREFIX = 'chairside.apple_name.';

function cacheKey(appleUserId: string): string {
  return `${KEY_PREFIX}${appleUserId}`;
}

async function loadSecureStore() {
  try {
    const { Platform } = await import('react-native');
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return null;
    }
    return await import('expo-secure-store');
  } catch {
    return null;
  }
}

/** Read a previously cached Apple name for this Apple user id (device-local). */
export async function getAppleCachedName(appleUserId: string): Promise<PersonNameParts | null> {
  if (!appleUserId) return null;

  try {
    const SecureStore = await loadSecureStore();
    if (!SecureStore) return null;

    const raw = await SecureStore.getItemAsync(cacheKey(appleUserId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { firstName?: unknown; lastName?: unknown };
    const firstName = typeof parsed.firstName === 'string' ? parsed.firstName.trim() : '';
    const lastName = typeof parsed.lastName === 'string' ? parsed.lastName.trim() : '';
    if (!firstName && !lastName) return null;
    return { firstName, lastName };
  } catch {
    return null;
  }
}

/** Persist Apple's one-time name payload keyed by Apple's stable user id. */
export async function setAppleCachedName(
  appleUserId: string,
  name: PersonNameParts,
): Promise<void> {
  if (!appleUserId) return;

  const firstName = name.firstName?.trim() ?? '';
  const lastName = name.lastName?.trim() ?? '';
  if (!firstName && !lastName) return;

  try {
    const SecureStore = await loadSecureStore();
    if (!SecureStore) return;

    await SecureStore.setItemAsync(
      cacheKey(appleUserId),
      JSON.stringify({ firstName, lastName }),
    );
  } catch {
    // Best-effort cache; sign-in should still succeed without it.
  }
}
