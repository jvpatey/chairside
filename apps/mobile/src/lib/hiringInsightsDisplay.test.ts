import { describe, expect, it } from 'vitest';

import {
  buildHiringPipelineStages,
  getHiringPipelineActiveStages,
  getHiringPipelineProgress,
  getHiringSpeedDisplay,
} from '@/lib/hiringInsightsDisplay';

describe('hiringInsightsDisplay', () => {
  it('collapses statuses into ordered stages with shares', () => {
    const stages = buildHiringPipelineStages(
      {
        applied: 4,
        screening_submitted: 2,
        reviewed: 3,
        interview_scheduled: 1,
        hired: 2,
        rejected: 1,
      },
      13,
    );

    expect(stages.map((stage) => [stage.id, stage.count])).toEqual([
      ['applied', 6],
      ['in_review', 3],
      ['interview', 1],
      ['hired', 2],
      ['closed', 1],
    ]);
    expect(stages[0]?.share).toBeCloseTo(6 / 13);
  });

  it('filters zero stages for the segment bar', () => {
    const stages = buildHiringPipelineStages({ applied: 2, hired: 1 }, 3);
    expect(getHiringPipelineActiveStages(stages).map((stage) => stage.id)).toEqual([
      'applied',
      'hired',
    ]);
  });

  it('computes progress past applied', () => {
    const stages = buildHiringPipelineStages(
      { applied: 4, reviewed: 2, hired: 2 },
      8,
    );
    expect(getHiringPipelineProgress(stages, 8)).toEqual({
      completed: 4,
      total: 8,
      progress: 0.5,
    });
  });

  it('prefers hire speed then first-applicant speed', () => {
    expect(getHiringSpeedDisplay(12.5, 2)).toEqual({
      value: '12.5',
      label: 'Avg days to hire',
    });
    expect(getHiringSpeedDisplay(null, 3.2)).toEqual({
      value: '3.2',
      label: 'Avg days to 1st applicant',
    });
    expect(getHiringSpeedDisplay(null, null)).toEqual({
      value: '—',
      label: 'Avg days to hire',
    });
  });
});
