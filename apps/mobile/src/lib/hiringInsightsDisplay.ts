export type HiringPipelineStageId =
  | 'applied'
  | 'in_review'
  | 'interview'
  | 'hired'
  | 'closed';

export type HiringPipelineStage = {
  id: HiringPipelineStageId;
  label: string;
  statuses: readonly string[];
  muted?: boolean;
};

export const HIRING_PIPELINE_STAGES: readonly HiringPipelineStage[] = [
  {
    id: 'applied',
    label: 'Applied',
    statuses: ['applied', 'screening_submitted'],
  },
  {
    id: 'in_review',
    label: 'In review',
    statuses: ['reviewed', 'in_progress'],
  },
  {
    id: 'interview',
    label: 'Interview',
    statuses: ['interview_offered', 'interview_scheduled'],
  },
  {
    id: 'hired',
    label: 'Hired',
    statuses: ['hired', 'selected'],
  },
  {
    id: 'closed',
    label: 'Closed',
    statuses: ['rejected'],
    muted: true,
  },
] as const;

export type HiringPipelineStageCount = {
  id: HiringPipelineStageId;
  label: string;
  count: number;
  share: number;
  muted: boolean;
};

function sumStatuses(pipeline: Record<string, number>, statuses: readonly string[]): number {
  return statuses.reduce((sum, status) => sum + (pipeline[status] ?? 0), 0);
}

/** Collapse raw application status counts into ordered funnel stages. */
export function buildHiringPipelineStages(
  pipeline: Record<string, number>,
  totalApplicants: number,
): HiringPipelineStageCount[] {
  const denominator = totalApplicants > 0 ? totalApplicants : 0;

  return HIRING_PIPELINE_STAGES.map((stage) => {
    const count = sumStatuses(pipeline, stage.statuses);
    return {
      id: stage.id,
      label: stage.label,
      count,
      share: denominator > 0 ? count / denominator : 0,
      muted: Boolean(stage.muted),
    };
  });
}

/** Stages with count > 0 for the segment bar (includes muted when present). */
export function getHiringPipelineActiveStages(
  stages: HiringPipelineStageCount[],
): HiringPipelineStageCount[] {
  return stages.filter((stage) => stage.count > 0);
}

/**
 * Share of applicants who have moved past the Applied stage.
 * Uses totalApplicants as denominator when available.
 */
export function getHiringPipelineProgress(
  stages: HiringPipelineStageCount[],
  totalApplicants: number,
): { completed: number; total: number; progress: number } {
  const applied = stages.find((stage) => stage.id === 'applied')?.count ?? 0;
  const total = Math.max(totalApplicants, 0);
  const completed = Math.max(total - applied, 0);
  return {
    completed,
    total,
    progress: total > 0 ? completed / total : 0,
  };
}

/** Prefer avg days to hire; fall back to first-applicant speed. */
export function getHiringSpeedDisplay(
  avgDaysToHire: number | null | undefined,
  avgDaysToFirstApplicant: number | null | undefined,
): { value: string; label: string } {
  if (avgDaysToHire != null) {
    return { value: String(avgDaysToHire), label: 'Avg days to hire' };
  }
  if (avgDaysToFirstApplicant != null) {
    return { value: String(avgDaysToFirstApplicant), label: 'Avg days to 1st applicant' };
  }
  return { value: '—', label: 'Avg days to hire' };
}
