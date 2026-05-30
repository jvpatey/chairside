import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HiringCelebrationAudience } from '@/lib/hiringCelebrationCopy';

const STORAGE_KEY_PREFIX = 'hiring_celebrations_shown';

function storageKey(audience: HiringCelebrationAudience): string {
  return `${STORAGE_KEY_PREFIX}_${audience}`;
}

export async function getCelebratedApplicationIds(
  audience: HiringCelebrationAudience,
): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(audience));
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export async function markApplicationCelebrated(
  audience: HiringCelebrationAudience,
  applicationId: string,
): Promise<void> {
  const ids = await getCelebratedApplicationIds(audience);
  ids.add(applicationId);
  await AsyncStorage.setItem(storageKey(audience), JSON.stringify([...ids]));
}

export async function filterUncelebratedApplicationIds(
  audience: HiringCelebrationAudience,
  applicationIds: string[],
): Promise<string[]> {
  const celebrated = await getCelebratedApplicationIds(audience);
  return applicationIds.filter((id) => !celebrated.has(id));
}
