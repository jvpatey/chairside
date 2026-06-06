import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@chairside/application-badge-seen';

type SeenUpdatedAtMap = Record<string, string>;

async function readSeenMap(): Promise<SeenUpdatedAtMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as SeenUpdatedAtMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function writeSeenMap(map: SeenUpdatedAtMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function getApplicationBadgeSeenMap(): Promise<SeenUpdatedAtMap> {
  return readSeenMap();
}

export async function markApplicationBadgeSeen(
  applicationId: string,
  updatedAt: string,
): Promise<SeenUpdatedAtMap> {
  const map = await readSeenMap();
  const next = { ...map, [applicationId]: updatedAt };
  await writeSeenMap(next);
  return next;
}

export async function markApplicationBadgesSeen(
  applications: { id: string; updated_at: string }[],
): Promise<SeenUpdatedAtMap> {
  if (applications.length === 0) return readSeenMap();

  const map = await readSeenMap();
  const next = { ...map };
  for (const application of applications) {
    next[application.id] = application.updated_at;
  }
  await writeSeenMap(next);
  return next;
}

/** Record first-seen baselines without overwriting newer clinic updates the user has not opened. */
export async function seedApplicationBadgeBaselines(
  applications: { id: string; updated_at: string }[],
): Promise<SeenUpdatedAtMap> {
  if (applications.length === 0) return readSeenMap();

  const map = await readSeenMap();
  const next = { ...map };
  let changed = false;

  for (const application of applications) {
    if (!next[application.id]) {
      next[application.id] = application.updated_at;
      changed = true;
    }
  }

  if (changed) {
    await writeSeenMap(next);
  }

  return changed ? next : map;
}
