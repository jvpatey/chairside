import { describe, expect, it } from 'vitest';
import type { ApplicationScreening } from '@chairside/api';

import { getScreeningListChips } from './screeningTriage';

describe('getScreeningListChips', () => {
  it('only returns flagged chips when screening failed a must-pass', () => {
    const screening: ApplicationScreening = {
      status: 'completed',
      createdAt: '2026-08-11T12:00:00.000Z',
      outcome: 'flagged',
      failedQuestionIds: ['years_experience_in_role'],
      answers: {
        questions: [
          {
            id: 'years_experience_in_role',
            prompt: 'How many years of experience do you have in this role?',
            type: 'number',
            answer: 2,
            knockout: { enabled: true, min: 5 },
          },
          {
            id: 'provincial_certification_training',
            prompt: 'Licensed?',
            type: 'yes_no',
            answer: true,
          },
        ],
      },
    };

    const result = getScreeningListChips(screening);
    expect(result.outcome).toBe('flagged');
    expect(result.chips).toEqual([
      {
        id: 'years_experience_in_role',
        label: 'Experience',
        value: '2 yrs',
        required: '5+ yrs',
        kind: 'qualification',
        failed: true,
      },
    ]);
  });

  it('hides chips when screening passed', () => {
    const screening: ApplicationScreening = {
      status: 'completed',
      createdAt: '2026-08-11T12:00:00.000Z',
      outcome: 'pass',
      failedQuestionIds: [],
      answers: {
        questions: [
          {
            id: 'provincial_certification_training',
            prompt: 'Licensed?',
            type: 'yes_no',
            answer: true,
          },
        ],
      },
    };

    expect(getScreeningListChips(screening).chips).toEqual([]);
  });
});
