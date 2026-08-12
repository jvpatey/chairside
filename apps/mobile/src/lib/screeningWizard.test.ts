import { describe, expect, it } from 'vitest';
import type { ScreeningQuestion } from '@chairside/api';

import {
  countAnsweredQuestions,
  isScreeningFormComplete,
  sortScreeningQuestions,
} from './screeningWizard';

function question(
  overrides: Partial<ScreeningQuestion> & Pick<ScreeningQuestion, 'id' | 'type' | 'prompt'>,
): ScreeningQuestion {
  return {
    catalogSlug: overrides.catalogSlug ?? overrides.id,
    customPrompt: null,
    sortOrder: overrides.sortOrder ?? 0,
    reverseScored: false,
    knockout: null,
    ...overrides,
  };
}

describe('screening form completion', () => {
  const questions = [
    question({ id: 'licensed', type: 'yes_no', prompt: 'Licensed?', sortOrder: 1 }),
    question({ id: 'years', type: 'number', prompt: 'Years?', sortOrder: 2 }),
    question({ id: 'note', type: 'text', prompt: 'Note?', sortOrder: 3 }),
  ];

  it('requires every question, including non-empty text', () => {
    expect(isScreeningFormComplete(questions, {})).toBe(false);
    expect(
      isScreeningFormComplete(questions, {
        licensed: true,
        years: 4,
        note: '   ',
      }),
    ).toBe(false);
    expect(
      isScreeningFormComplete(questions, {
        licensed: true,
        years: 4,
        note: 'Ready to start',
      }),
    ).toBe(true);
  });

  it('counts only complete answers', () => {
    expect(
      countAnsweredQuestions(questions, {
        licensed: true,
        note: '',
      }),
    ).toBe(1);
  });

  it('keeps clinic sort order', () => {
    const sorted = sortScreeningQuestions([
      question({ id: 'b', type: 'yes_no', prompt: 'B', sortOrder: 20 }),
      question({ id: 'a', type: 'yes_no', prompt: 'A', sortOrder: 10 }),
    ]);
    expect(sorted.map((item) => item.id)).toEqual(['a', 'b']);
  });
});
