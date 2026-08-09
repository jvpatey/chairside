import { describe, expect, it } from 'vitest';

import {
  MOBILE_TAB_ORDER,
  TABLET_SIDEBAR_SECTIONS,
  TABLET_SIDEBAR_TAB_ORDER,
} from '@/components/navigation/tabOrder';

describe('clinic tab order', () => {
  it('shows discover in the sidebar but not the mobile dock', () => {
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).toContain('discover');
    expect(MOBILE_TAB_ORDER.clinic).not.toContain('discover');
  });

  it('groups hiring workflow above discover and utilities', () => {
    expect(TABLET_SIDEBAR_SECTIONS.clinic[0]?.routes).toEqual([
      'index',
      'postings',
      'applications',
      'fill-ins',
    ]);
    expect(TABLET_SIDEBAR_SECTIONS.clinic[1]?.routes).toEqual([
      'discover',
      'calendar',
      'messages',
    ]);
  });

  it('orders mobile dock tabs with fill-ins before calendar', () => {
    expect(MOBILE_TAB_ORDER.clinic.indexOf('fill-ins')).toBeLessThan(
      MOBILE_TAB_ORDER.clinic.indexOf('calendar'),
    );
  });
});
