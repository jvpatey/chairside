import { describe, expect, it } from 'vitest';

import {
  MOBILE_TAB_ORDER,
  TABLET_SIDEBAR_SECTIONS,
  TABLET_SIDEBAR_TAB_ORDER,
} from '@/components/navigation/tabOrder';

describe('coverage-network tab order', () => {
  it('keeps mobile dock to Home, Fill-ins, Roles, and Settings', () => {
    expect(MOBILE_TAB_ORDER.worker).toEqual(['index', 'fillins', 'browse', 'profile']);
    expect(MOBILE_TAB_ORDER.clinic).toEqual(['index', 'fill-ins', 'postings', 'profile']);
  });

  it('keeps tablet sidebar primary nav without Settings (footer handles it)', () => {
    expect(TABLET_SIDEBAR_TAB_ORDER.worker).toEqual(['index', 'fillins', 'browse']);
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).toEqual(['index', 'fill-ins', 'postings']);
  });

  it('does not surface Discover, Messages, Calendar, or Applications in primary nav', () => {
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
    }
    expect(TABLET_SIDEBAR_TAB_ORDER.worker).not.toContain('profile');
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).not.toContain('profile');
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
