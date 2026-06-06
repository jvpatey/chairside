import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@chairside/shift-post-seen';

async function readSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

async function writeSeenIds(ids: Set<string>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

export async function getSeenShiftPostIds(): Promise<Set<string>> {
  return readSeenIds();
}

/** Adds shift post IDs to the seen set; never removes existing entries. */
export async function markShiftPostsSeen(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return readSeenIds();

  const seen = await readSeenIds();
  let changed = false;

  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      changed = true;
    }
  }

  if (changed) {
    await writeSeenIds(seen);
  }

  return seen;
}
