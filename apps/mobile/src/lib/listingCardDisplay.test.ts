import { describe, expect, it } from 'vitest';

import { buildFillInListingMetaRows, buildRoleListingMetaRows } from './listingCardDisplay';

describe('listingCardDisplay view meta', () => {
  it('omits views when count is zero or missing', () => {
    const rows = buildRoleListingMetaRows({
      location: 'Halifax, NS',
      roleMeta: 'Hygienist · Permanent',
      postedAt: '2026-01-01T12:00:00.000Z',
      viewCount: 0,
    });
    expect(rows.some((row) => row.icon === 'eye-outline')).toBe(false);
  });

  it('includes views for role and fill-in cards when count is positive', () => {
    const roleRows = buildRoleListingMetaRows({
      location: 'Halifax, NS',
      roleMeta: 'Hygienist · Permanent',
      postedAt: '2026-01-01T12:00:00.000Z',
      viewCount: 12,
    });
    expect(roleRows).toContainEqual({ icon: 'eye-outline', label: '12 views' });

    const fillInRows = buildFillInListingMetaRows({
      location: 'Halifax, NS',
      shiftMeta: 'Mon · 9:00–5:00',
      postedAt: '2026-01-01T12:00:00.000Z',
      viewCount: 1,
    });
    expect(fillInRows).toContainEqual({ icon: 'eye-outline', label: '1 view' });
  });

  it('supports compensation and omits role meta when not provided', () => {
    const rows = buildRoleListingMetaRows({
      location: 'Dartmouth, NS',
      compensation: '$45/hr',
      postedAt: '2026-01-01T12:00:00.000Z',
    });
    expect(rows).toContainEqual({ icon: 'cash-outline', label: '$45/hr' });
    expect(rows.some((row) => row.icon === 'briefcase-outline')).toBe(false);
  });
});
