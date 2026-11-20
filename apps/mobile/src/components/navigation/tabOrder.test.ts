import { describe, expect, it } from 'vitest';

import {
  MOBILE_TAB_ORDER,
  TABLET_SIDEBAR_SECTIONS,
  TABLET_SIDEBAR_TAB_ORDER,
} from '@/components/navigation/tabOrder';

describe('coverage-network tab order', () => {
  it('keeps primary nav to Home, Fill-ins, and Roles', () => {
    expect(MOBILE_TAB_ORDER.worker).toEqual(['index', 'fillins', 'browse']);
    expect(MOBILE_TAB_ORDER.clinic).toEqual(['index', 'fill-ins', 'postings']);
    expect(TABLET_SIDEBAR_TAB_ORDER.worker).toEqual(MOBILE_TAB_ORDER.worker);
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).toEqual(MOBILE_TAB_ORDER.clinic);
  });

  it('does not surface Discover, Messages, Calendar, Applications, or Profile in primary nav', () => {
    for (const order of [
      MOBILE_TAB_ORDER.worker,
      MOBILE_TAB_ORDER.clinic,
      TABLET_SIDEBAR_TAB_ORDER.worker,
      TABLET_SIDEBAR_TAB_ORDER.clinic,
    ]) {
      expect(order).not.toContain('discover');
      expect(order).not.toContain('messages');
      expect(order).not.toContain('calendar');
      expect(order).not.toContain('applications');
      expect(order).not.toContain('profile');
    }
  });

  it('groups a single primary section for sidebar', () => {
    expect(TABLET_SIDEBAR_SECTIONS.clinic).toEqual([
      { label: null, routes: ['index', 'fill-ins', 'postings'] },
    ]);
    expect(TABLET_SIDEBAR_SECTIONS.worker).toEqual([
      { label: null, routes: ['index', 'fillins', 'browse'] },
    ]);
  });

  it('orders fill-ins ahead of roles', () => {
    expect(MOBILE_TAB_ORDER.clinic.indexOf('fill-ins')).toBeLessThan(
      MOBILE_TAB_ORDER.clinic.indexOf('postings'),
    );
    expect(MOBILE_TAB_ORDER.worker.indexOf('fillins')).toBeLessThan(
      MOBILE_TAB_ORDER.worker.indexOf('browse'),
    );
  });
});
