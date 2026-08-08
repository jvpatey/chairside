import { describe, expect, it } from 'vitest';

import {
  computePasswordStrength,
  evaluatePassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from './passwordPolicy';

describe('evaluatePassword', () => {
  it('requires at least the minimum length', () => {
    const short = evaluatePassword('1234567');
    const valid = evaluatePassword('12345678');

    expect(short.isValid).toBe(false);
    expect(short.requirements.find((requirement) => requirement.id === 'minLength')?.met).toBe(
      false,
    );
    expect(valid.requirements.find((requirement) => requirement.id === 'minLength')?.met).toBe(true);
  });

  it('rejects passwords longer than the bcrypt limit', () => {
    const tooLong = 'a'.repeat(PASSWORD_MAX_LENGTH + 1);
    const result = evaluatePassword(tooLong);

    expect(result.isValid).toBe(false);
    expect(result.maxLengthError).toBe(`Use at most ${PASSWORD_MAX_LENGTH} characters.`);
  });

  it('accepts passwords at the max length boundary', () => {
    const atMax = 'a'.repeat(PASSWORD_MAX_LENGTH);
    const result = evaluatePassword(atMax);

    expect(result.maxLengthError).toBeNull();
    expect(result.requirements.find((requirement) => requirement.id === 'minLength')?.met).toBe(
      true,
    );
  });

  it('rejects common passwords', () => {
    const result = evaluatePassword('password');

    expect(result.isValid).toBe(false);
    expect(result.requirements.find((requirement) => requirement.id === 'notCommon')?.met).toBe(
      false,
    );
  });

  it('rejects passwords containing the email local part', () => {
    const result = evaluatePassword('johnchairside!', { email: 'john@example.com' });

    expect(result.isValid).toBe(false);
    expect(
      result.requirements.find((requirement) => requirement.id === 'noEmailContext')?.met,
    ).toBe(false);
  });

  it('ignores very short email local parts to avoid false positives', () => {
    const result = evaluatePassword('abchairside!', { email: 'ab@example.com' });

    expect(
      result.requirements.find((requirement) => requirement.id === 'noEmailContext')?.met,
    ).toBe(true);
  });

  it('marks a strong unique password as valid', () => {
    const result = evaluatePassword('river-lamp-orchard-42', {
      email: 'alex@example.com',
    });

    expect(result.isValid).toBe(true);
    expect(result.requirements.every((requirement) => requirement.met)).toBe(true);
  });
});

describe('computePasswordStrength', () => {
  it('increases monotonically for stronger passwords', () => {
    const samples = [
      '123',
      '12345678',
      'river-lamp-42',
      'river-lamp-orchard-42',
      'River-Lamp-Orchard-42!-extra',
    ];

    let previousScore = -1;
    for (const sample of samples) {
      const { score } = computePasswordStrength(sample);
      expect(score).toBeGreaterThanOrEqual(previousScore);
      previousScore = score;
    }
  });

  it('returns zero strength for empty input', () => {
    expect(computePasswordStrength('')).toEqual({
      score: 0,
      label: 'Very weak',
      ratio: 0,
    });
  });
});

describe('PASSWORD_MIN_LENGTH', () => {
  it('is 8 characters', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});
