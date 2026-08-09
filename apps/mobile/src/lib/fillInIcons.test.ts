import { describe, expect, it } from 'vitest';

import { FILL_IN_ICON, fillInTabIcon, isFillInIcon } from '@/lib/fillInIcons';

describe('fillInIcons', () => {
  it('uses timer icons for fill-in navigation', () => {
    expect(FILL_IN_ICON.outline).toBe('timer-outline');
    expect(FILL_IN_ICON.filled).toBe('timer');
  });

  it('returns filled icon when tab is focused', () => {
    expect(fillInTabIcon(false)).toBe('timer-outline');
    expect(fillInTabIcon(true)).toBe('timer');
  });

  it('recognizes canonical fill-in icon names', () => {
    expect(isFillInIcon('timer-outline')).toBe(true);
    expect(isFillInIcon('timer')).toBe(true);
    expect(isFillInIcon('flash-outline')).toBe(false);
  });
});
