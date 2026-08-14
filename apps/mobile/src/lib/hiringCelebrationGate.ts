import type { CelebrationCandidate } from './hiringCelebrationCandidates';

/** Ignore hires older than this so past roles don't celebrate on a later visit. */
export const HIRING_CELEBRATION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function isEligibleWorkerHireStatus(
  postType: CelebrationCandidate['postType'],
  status: string,
): boolean {
  return postType === 'shift' ? status === 'hired' : status === 'selected';
}

export function isRecentHiringCelebration(
  updatedAt: string | undefined,
  now = Date.now(),
): boolean {
  if (!updatedAt) return false;
  const timestamp = Date.parse(updatedAt);
  if (Number.isNaN(timestamp)) return false;
  const ageMs = now - timestamp;
  return ageMs >= 0 && ageMs <= HIRING_CELEBRATION_MAX_AGE_MS;
}

export function pickWorkerHiringCelebration(
  candidates: CelebrationCandidate[],
  knownHiredIds: Iterable<string>,
  now = Date.now(),
): {
  toShow: CelebrationCandidate | null;
  nextKnownHiredIds: Set<string>;
} {
  const known = new Set(knownHiredIds);
  const eligible = candidates.filter((candidate) =>
    isEligibleWorkerHireStatus(candidate.postType, candidate.status),
  );
  const discovered = eligible.filter((candidate) => !known.has(candidate.id));
  const nextKnownHiredIds = new Set(known);

  const recentNew = discovered
    .filter((candidate) => isRecentHiringCelebration(candidate.updatedAt, now))
    .sort((a, b) => {
      const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
      const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
      return bTime - aTime;
    });

  const toShow = recentNew[0] ?? null;

  for (const candidate of discovered) {
    if (candidate.id === toShow?.id) continue;
    nextKnownHiredIds.add(candidate.id);
  }

  return { toShow, nextKnownHiredIds };
}
