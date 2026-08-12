import { describe, expect, it } from 'vitest';
import {
  answerPassesKnockout,
  evaluateScreeningAnswers,
  formatScreeningRequirementLabel,
  getDefaultScreeningSelection,
  getRecommendedCultureFitSelection,
} from './screeningQuestions';

describe('screening defaults', () => {
  it('defaults to qualifications only', () => {
    const defaults = getDefaultScreeningSelection();
    expect(defaults.length).toBeGreaterThan(0);
    expect(defaults.every((slug) => slug.includes('experience') || slug.includes('cert') || slug.includes('employed') || slug.includes('notice') || slug.includes('schedule') || slug.includes('years') || slug.includes('reliable') || slug.includes('provincial') || slug.includes('currently') || slug.includes('weeks'))).toBe(true);
    expect(defaults).not.toContain('attr_honest');
    expect(defaults).not.toContain('team_setting');
  });

  it('recommends a short culture pack without attribute ratings', () => {
    const culture = getRecommendedCultureFitSelection();
    expect(culture).toEqual([
      'team_setting',
      'respectful_communication',
      'pride_in_work',
      'contribute_clean_workspace',
    ]);
    expect(culture).not.toContain('attr_honest');
    expect(culture).not.toContain('transactional_environment');
  });
});

describe('screening requirement labels', () => {
  it('formats yes/no and number must-pass rules', () => {
    expect(
      formatScreeningRequirementLabel('yes_no', { enabled: true, expectedBool: true }),
    ).toBe('Yes');
    expect(
      formatScreeningRequirementLabel('number', { enabled: true, min: 5 }, 'years', true),
    ).toBe('5+ yrs');
    expect(
      formatScreeningRequirementLabel('number', { enabled: true, min: 5, max: 10 }, 'years'),
    ).toBe('5–10 years');
  });
});

describe('screening knockouts', () => {
  it('passes yes_no when expected matches', () => {
    expect(
      answerPassesKnockout('yes_no', true, { enabled: true, expectedBool: true }),
    ).toBe(true);
    expect(
      answerPassesKnockout('yes_no', false, { enabled: true, expectedBool: true }),
    ).toBe(false);
  });

  it('enforces number min/max', () => {
    expect(
      answerPassesKnockout('number', 3, { enabled: true, min: 2, max: 5 }),
    ).toBe(true);
    expect(
      answerPassesKnockout('number', 1, { enabled: true, min: 2, max: null }),
    ).toBe(false);
  });

  it('evaluates flagged outcome', () => {
    const result = evaluateScreeningAnswers(
      [{ id: 'provincial_certification_training', type: 'yes_no', answer: false }],
      [
        {
          id: 'provincial_certification_training',
          type: 'yes_no',
          prompt: 'Licensed?',
          knockout: { enabled: true, expectedBool: true },
        },
      ],
    );
    expect(result.outcome).toBe('flagged');
    expect(result.failedQuestionIds).toEqual(['provincial_certification_training']);
  });

  it('returns null outcome when no knockouts', () => {
    const result = evaluateScreeningAnswers(
      [{ id: 'years_experience_in_role', type: 'number', answer: 4 }],
      [
        {
          id: 'years_experience_in_role',
          type: 'number',
          prompt: 'Years?',
          knockout: null,
        },
      ],
    );
    expect(result.outcome).toBeNull();
  });
});
