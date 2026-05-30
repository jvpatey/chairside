import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'hiring_celebrations_shown';

export async function getCelebratedApplicationIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string'));
  } catch {
    return new Set();
  }
}

export async function markApplicationCelebrated(applicationId: string): Promise<void> {
  const ids = await getCelebratedApplicationIds();
  ids.add(applicationId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export async function filterUncelebratedApplicationIds(applicationIds: string[]): Promise<string[]> {
  const celebrated = await getCelebratedApplicationIds();
  return applicationIds.filter((id) => !celebrated.has(id));
}
