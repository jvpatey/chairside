import { describe, expect, it } from 'vitest';

import { computeScrollFadeState } from './chipScrollFade';

describe('computeScrollFadeState', () => {
  it('returns false for both edges when content fits', () => {
    expect(computeScrollFadeState(0, 300, 300)).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    });
    expect(computeScrollFadeState(0, 300, 280)).toEqual({
      canScrollLeft: false,
      canScrollRight: false,
    });
  });

  it('shows right fade at scroll start', () => {
    expect(computeScrollFadeState(0, 300, 600)).toEqual({
      canScrollLeft: false,
      canScrollRight: true,
    });
  });

  it('shows both fades in the middle', () => {
    expect(computeScrollFadeState(150, 300, 600)).toEqual({
      canScrollLeft: true,
      canScrollRight: true,
    });
  });

  it('shows left fade at scroll end', () => {
    expect(computeScrollFadeState(300, 300, 600)).toEqual({
      canScrollLeft: true,
      canScrollRight: false,
    });
  });
});
