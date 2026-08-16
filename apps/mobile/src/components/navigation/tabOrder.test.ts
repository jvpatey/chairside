import { describe, expect, it } from 'vitest';

import {
  MOBILE_TAB_ORDER,
  TABLET_SIDEBAR_SECTIONS,
  TABLET_SIDEBAR_TAB_ORDER,
  isEmphasizedSidebarRoute,
} from '@/components/navigation/tabOrder';

describe('clinic tab order', () => {
  it('shows discover in the sidebar but not the mobile dock', () => {
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).toContain('discover');
    expect(MOBILE_TAB_ORDER.clinic).not.toContain('discover');
  });

  it('groups hiring workflow above discover and utilities', () => {
    expect(TABLET_SIDEBAR_SECTIONS.clinic[0]?.routes).toEqual([
      'index',
      'fill-ins',
      'postings',
      'applications',
    ]);
    expect(TABLET_SIDEBAR_SECTIONS.clinic[1]?.routes).toEqual([
      'discover',
      'calendar',
      'messages',
    ]);
  });

  it('orders fill-ins ahead of roles and applications', () => {
    expect(MOBILE_TAB_ORDER.clinic.indexOf('fill-ins')).toBeLessThan(
      MOBILE_TAB_ORDER.clinic.indexOf('postings'),
    );
    expect(MOBILE_TAB_ORDER.clinic.indexOf('fill-ins')).toBeLessThan(
      MOBILE_TAB_ORDER.clinic.indexOf('applications'),
    );
    expect(TABLET_SIDEBAR_TAB_ORDER.worker.indexOf('fillins')).toBeLessThan(
      TABLET_SIDEBAR_TAB_ORDER.worker.indexOf('browse'),
    );
  });

  it('emphasizes fill-ins and roles in the sidebar', () => {
    expect(isEmphasizedSidebarRoute('fill-ins')).toBe(true);
    expect(isEmphasizedSidebarRoute('postings')).toBe(true);
    expect(isEmphasizedSidebarRoute('applications')).toBe(false);
  });
});
