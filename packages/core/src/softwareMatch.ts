const NON_MATCHABLE_SOFTWARE = new Set(['none', 'other']);

export function normalizeSoftwareToken(value: string): string {
  return value.trim().toLowerCase();
}

export function isMatchableSoftware(value: string): boolean {
  const normalized = normalizeSoftwareToken(value);
  return normalized.length > 0 && !NON_MATCHABLE_SOFTWARE.has(normalized);
}

export function matchableSoftwareTokens(software: string[] | null | undefined): string[] {
  return (software ?? [])
    .filter(isMatchableSoftware)
    .map(normalizeSoftwareToken);
}

export type SoftwareMatchLevel = 'strong' | 'partial' | 'missing';

export function scoreSoftwareMatch(
  postSoftware: string[] | null | undefined,
  workerSoftware: string[] | null | undefined,
): SoftwareMatchLevel {
  const post = matchableSoftwareTokens(postSoftware);
  const worker = new Set(matchableSoftwareTokens(workerSoftware));

  if (post.length === 0) return 'partial';

  const overlap = post.filter((item) => worker.has(item)).length;
  if (overlap === post.length) return 'strong';
  if (overlap > 0) return 'partial';
  return 'missing';
}
