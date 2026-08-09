import { describe, expect, it } from 'vitest';

import {
  formatWorkerEducation,
  getEducationDegreeTypeLabel,
  isNoPostSecondaryEducation,
} from './clinicOptions';

describe('worker education formatting', () => {
  it('labels none_post_secondary explicitly', () => {
    expect(getEducationDegreeTypeLabel('none_post_secondary')).toBe(
      'No post-secondary education',
    );
    expect(isNoPostSecondaryEducation('none_post_secondary')).toBe(true);
    expect(isNoPostSecondaryEducation('diploma')).toBe(false);
  });

  it('formats none without stale detail fields', () => {
    expect(
      formatWorkerEducation({
        education_degree_type: 'none_post_secondary',
        education_field: 'Dental hygiene',
        education_institution: 'Dalhousie',
        education_graduation_year: 2018,
      }),
    ).toBe('No post-secondary education');
  });

  it('formats credential details when present', () => {
    expect(
      formatWorkerEducation({
        education_degree_type: 'diploma',
        education_field: 'Dental hygiene',
        education_institution: 'NSCC',
        education_graduation_year: 2018,
      }),
    ).toBe('Diploma · Dental hygiene · NSCC · 2018');
  });
});
