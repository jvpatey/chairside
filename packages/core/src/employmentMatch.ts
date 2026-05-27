export type EmploymentMatchLevel = 'strong' | 'partial' | 'missing';

export function scoreEmploymentMatch(
  jobEmploymentType: string,
  workerPreferredEmploymentTypes: string[] | null | undefined,
): EmploymentMatchLevel {
  const preferred = (workerPreferredEmploymentTypes ?? []).filter(
    (value) => value.trim().length > 0,
  );

  if (preferred.length === 0) return 'partial';
  if (preferred.includes(jobEmploymentType)) return 'strong';
  return 'missing';
}
