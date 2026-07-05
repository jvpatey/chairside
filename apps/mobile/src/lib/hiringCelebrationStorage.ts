import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HiringCelebrationAudience } from '@/lib/hiringCelebrationCopy';

const STORAGE_KEY_PREFIX = 'hiring_celebrations_shown';
const LEGACY_SENTINEL = '__legacy__';

type CelebratedTimestamps = Record<string, string>;

function storageKey(audience: HiringCelebrationAudience): string {
  return `${STORAGE_KEY_PREFIX}_${audience}`;
}

async function persistCelebratedTimestamps(
  audience: HiringCelebrationAudience,
  timestamps: CelebratedTimestamps,
): Promise<void> {
  const normalized = Object.fromEntries(
    Object.entries(timestamps).filter(([, value]) => value !== LEGACY_SENTINEL),
  );
  await AsyncStorage.setItem(storageKey(audience), JSON.stringify(normalized));
}

export async function getCelebratedApplicationTimestamps(
  audience: HiringCelebrationAudience,
): Promise<CelebratedTimestamps> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(audience));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed
          .filter((id): id is string => typeof id === 'string')
          .map((id) => [id, LEGACY_SENTINEL]),
      );
    }
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as CelebratedTimestamps;
    }
    return {};
  } catch {
    return {};
  }
}

export async function markApplicationCelebrated(
  audience: HiringCelebrationAudience,
  applicationId: string,
  updatedAt: string,
): Promise<void> {
  const timestamps = await getCelebratedApplicationTimestamps(audience);
  timestamps[applicationId] = updatedAt;
  await persistCelebratedTimestamps(audience, timestamps);
}

export async function filterUncelebratedCelebrationCandidates<
  T extends { id: string; updatedAt?: string },
>(audience: HiringCelebrationAudience, candidates: T[]): Promise<T[]> {
  const celebrated = await getCelebratedApplicationTimestamps(audience);
  const legacyMigrations: CelebratedTimestamps = {};
  const uncelebrated: T[] = [];

  for (const candidate of candidates) {
    const celebratedAt = celebrated[candidate.id];
    if (!celebratedAt) {
      uncelebrated.push(candidate);
      continue;
    }

    if (celebratedAt === LEGACY_SENTINEL) {
      if (candidate.updatedAt) {
        legacyMigrations[candidate.id] = candidate.updatedAt;
      }
      continue;
    }

    if (!candidate.updatedAt) {
      continue;
    }

    if (new Date(candidate.updatedAt).getTime() > new Date(celebratedAt).getTime()) {
      uncelebrated.push(candidate);
    }
  }

  if (Object.keys(legacyMigrations).length > 0) {
    await persistCelebratedTimestamps(audience, { ...celebrated, ...legacyMigrations });
  }

  return uncelebrated;
}

/** @deprecated Use filterUncelebratedCelebrationCandidates. */
export async function filterUncelebratedApplicationIds(
  audience: HiringCelebrationAudience,
  applicationIds: string[],
): Promise<string[]> {
  const uncelebrated = await filterUncelebratedCelebrationCandidates(
    audience,
    applicationIds.map((id) => ({ id })),
  );
  return uncelebrated.map((candidate) => candidate.id);
}

/** @deprecated Use getCelebratedApplicationTimestamps. */
export async function getCelebratedApplicationIds(
  audience: HiringCelebrationAudience,
): Promise<Set<string>> {
  const timestamps = await getCelebratedApplicationTimestamps(audience);
  return new Set(Object.keys(timestamps));
}
