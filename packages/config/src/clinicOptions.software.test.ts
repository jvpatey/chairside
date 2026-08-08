import { describe, expect, it } from 'vitest';

import {
  buildSoftwareUsedFromParts,
  matchStandardSoftwareOption,
  parseCustomSoftwareInput,
  resolveSoftwareSelection,
  splitSoftwareUsed,
} from './clinicOptions';

describe('software used helpers', () => {
  it('parses a typed draft into separate entries', () => {
    expect(parseCustomSoftwareInput('Dentrix Ascend, Oscar')).toEqual([
      'Dentrix Ascend',
      'Oscar',
    ]);
    expect(parseCustomSoftwareInput('Dentrix Ascend, dentrix ascend')).toEqual(['Dentrix Ascend']);
    expect(parseCustomSoftwareInput('  Curve   Hero  ')).toEqual(['Curve Hero']);
    expect(parseCustomSoftwareInput('   ')).toEqual([]);
  });

  it('matches typed preset names so they select the existing chip', () => {
    expect(matchStandardSoftwareOption('dentrix')).toBe('Dentrix');
    expect(matchStandardSoftwareOption('open dental')).toBe('Open Dental');
    expect(matchStandardSoftwareOption('Oscar')).toBeNull();
    expect(matchStandardSoftwareOption('Other')).toBeNull();
    expect(matchStandardSoftwareOption('None')).toBeNull();
  });

  it('splits stored values into chips and custom entries', () => {
    expect(splitSoftwareUsed(['Dentrix', 'Dentrix Ascend'])).toEqual({
      chipSelection: ['Dentrix', 'Other'],
      customSoftware: ['Dentrix Ascend'],
    });
    expect(splitSoftwareUsed(['None'])).toEqual({
      chipSelection: ['None'],
      customSoftware: [],
    });
  });

  it('builds stored values without the literal Other chip', () => {
    expect(buildSoftwareUsedFromParts(['Dentrix', 'Other'], ['Dentrix Ascend'])).toEqual([
      'Dentrix',
      'Dentrix Ascend',
    ]);
    expect(buildSoftwareUsedFromParts(['Other'], [])).toEqual([]);
    expect(buildSoftwareUsedFromParts(['Other'], ['Oscar'])).toEqual(['Oscar']);
    expect(buildSoftwareUsedFromParts(['None', 'Dentrix'], ['Oscar'])).toEqual(['None']);
  });

  it('drops duplicate custom entries that already exist as chips', () => {
    expect(buildSoftwareUsedFromParts(['Dentrix', 'Other'], ['dentrix', 'Oscar'])).toEqual([
      'Dentrix',
      'Oscar',
    ]);
    expect(buildSoftwareUsedFromParts(['Other'], ['Oscar', 'oscar'])).toEqual(['Oscar']);
  });

  it('keeps None mutually exclusive', () => {
    expect(resolveSoftwareSelection(['Dentrix'], ['None', 'Dentrix'])).toEqual(['None']);
    expect(resolveSoftwareSelection(['None'], ['None', 'Dentrix'])).toEqual(['Dentrix']);
    expect(resolveSoftwareSelection([], ['None'])).toEqual(['None']);
  });
});
