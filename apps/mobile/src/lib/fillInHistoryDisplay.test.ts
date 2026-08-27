import { describe, expect, it } from 'vitest';

import {
  formatConfirmedFillInDescription,
  formatConfirmedFillInHeadline,
  formatConfirmedFillInKindLabel,
  formatConfirmedFillInStatusLabel,
  formatFilledInTitle,
  getConfirmedFillInCardCopy,
  resolveConfirmedFillInStatusLabel,
} from '@/lib/fillInHistoryDisplay';

describe('formatFilledInTitle', () => {
  it('names the worker who covered a clinic shift', () => {
    expect(formatFilledInTitle('Alex Rivera', 'clinic')).toBe('Alex Rivera filled in');
  });

  it('names the clinic a worker covered', () => {
    expect(formatFilledInTitle('Harbour Dental', 'worker')).toBe('Filled in at Harbour Dental');
  });

  it('falls back when the counterpart name is missing', () => {
    expect(formatFilledInTitle('  ', 'clinic')).toBe('Filled in');
    expect(formatFilledInTitle(null, 'worker')).toBe('Filled in');
  });
});

describe('confirmed fill-in labels', () => {
  it('keeps upcoming copy in the present tense', () => {
    expect(formatConfirmedFillInKindLabel(false)).toBe('Confirmed fill-in');
    expect(formatConfirmedFillInStatusLabel(false)).toBe('Confirmed');
    expect(formatConfirmedFillInHeadline(false)).toBe('Fill-in confirmed');
  });

  it('switches past fill-ins to filled-in copy', () => {
    expect(formatConfirmedFillInKindLabel(true)).toBe('Filled in');
    expect(formatConfirmedFillInStatusLabel(true)).toBe('Filled in');
    expect(formatConfirmedFillInHeadline(true)).toBe('Filled in');
  });
});

describe('formatConfirmedFillInDescription', () => {
  it('keeps upcoming confirmation copy', () => {
    expect(formatConfirmedFillInDescription('worker', false)).toBe('This fill-in was confirmed.');
    expect(formatConfirmedFillInDescription('clinic', false)).toBe(
      'This candidate was confirmed for the fill-in.',
    );
  });

  it('uses past-tense copy for completed fill-ins', () => {
    expect(formatConfirmedFillInDescription('worker', true)).toBe('You filled in on this day.');
    expect(formatConfirmedFillInDescription('clinic', true, 'Alex')).toBe(
      'Alex filled in on this day.',
    );
    expect(formatConfirmedFillInDescription('clinic', true)).toBe(
      'This candidate filled in on this day.',
    );
  });
});

describe('getConfirmedFillInCardCopy', () => {
  it('keeps the counterpart name as the upcoming title', () => {
    expect(
      getConfirmedFillInCardCopy({
        counterpartName: 'Harbour Dental',
        audience: 'worker',
        isPast: false,
      }),
    ).toEqual({
      eyebrow: 'Confirmed fill-in',
      title: 'Harbour Dental',
    });
  });

  it('rewrites past clinic calendar cards around the worker name', () => {
    expect(
      getConfirmedFillInCardCopy({
        counterpartName: 'Alex Rivera',
        audience: 'clinic',
        isPast: true,
      }),
    ).toEqual({
      eyebrow: 'Filled in',
      title: 'Alex Rivera filled in',
    });
  });

  it('rewrites past worker calendar cards around the clinic name', () => {
    expect(
      getConfirmedFillInCardCopy({
        counterpartName: 'Harbour Dental',
        audience: 'worker',
        isPast: true,
      }),
    ).toEqual({
      eyebrow: 'Filled in',
      title: 'Filled in at Harbour Dental',
    });
  });
});

describe('resolveConfirmedFillInStatusLabel', () => {
  it('returns filled-in only for past hired fill-ins', () => {
    expect(resolveConfirmedFillInStatusLabel({ status: 'hired', shiftDate: '2020-01-01' })).toBe(
      'Filled in',
    );
    expect(resolveConfirmedFillInStatusLabel({ status: 'hired', shiftDate: '2099-01-01' })).toBe(
      null,
    );
    expect(resolveConfirmedFillInStatusLabel({ status: 'applied', shiftDate: '2020-01-01' })).toBe(
      null,
    );
  });
});
