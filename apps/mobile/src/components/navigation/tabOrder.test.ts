import { describe, expect, it } from 'vitest';

import { MOBILE_TAB_ORDER, TABLET_SIDEBAR_TAB_ORDER } from '@/components/navigation/tabOrder';

describe('clinic tab order', () => {
  it('shows discover in the sidebar but not the mobile dock', () => {
    expect(TABLET_SIDEBAR_TAB_ORDER.clinic).toContain('discover');
    expect(MOBILE_TAB_ORDER.clinic).not.toContain('discover');
  });
});
