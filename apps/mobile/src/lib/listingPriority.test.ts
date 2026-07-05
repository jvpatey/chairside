import { describe, expect, it } from 'vitest';

import { comparePriorityListingDesc, sortWithPriorityFirst } from '@/lib/listingPriority';

type ListingItem = {
  id: string;
  has_priority_listing: boolean;
  created_at: string;
  shift_date?: string;
};

describe('comparePriorityListingDesc', () => {
  it('ranks featured listings first', () => {
    expect(
      comparePriorityListingDesc(
        { has_priority_listing: true },
        { has_priority_listing: false },
      ),
    ).toBeLessThan(0);
  });
});

describe('sortWithPriorityFirst', () => {
  it('puts featured roles before non-featured when sorting by newest', () => {
    const items: ListingItem[] = [
      {
        id: 'standard-newer',
        has_priority_listing: false,
        created_at: '2026-07-01T00:00:00Z',
      },
      {
        id: 'featured-older',
        has_priority_listing: true,
        created_at: '2026-06-01T00:00:00Z',
      },
    ];

    const sorted = sortWithPriorityFirst(items, (a, b) =>
      b.created_at.localeCompare(a.created_at),
    );

    expect(sorted.map((item) => item.id)).toEqual(['featured-older', 'standard-newer']);
  });

  it('puts featured fill-ins before non-featured even when the date is later', () => {
    const items: ListingItem[] = [
      {
        id: 'standard-sooner',
        has_priority_listing: false,
        created_at: '2026-06-01T00:00:00Z',
        shift_date: '2026-07-05',
      },
      {
        id: 'featured-later',
        has_priority_listing: true,
        created_at: '2026-06-01T00:00:00Z',
        shift_date: '2026-07-10',
      },
    ];

    const sorted = sortWithPriorityFirst(items, (a, b) =>
      (a.shift_date ?? '').localeCompare(b.shift_date ?? ''),
    );

    expect(sorted[0]?.id).toBe('featured-later');
  });

  it('keeps secondary sort within the same priority tier', () => {
    const items: ListingItem[] = [
      {
        id: 'later',
        has_priority_listing: false,
        created_at: '2026-07-20T00:00:00Z',
        shift_date: '2026-07-20',
      },
      {
        id: 'sooner',
        has_priority_listing: false,
        created_at: '2026-07-05T00:00:00Z',
        shift_date: '2026-07-05',
      },
    ];

    const sorted = sortWithPriorityFirst(items, (a, b) =>
      (a.shift_date ?? '').localeCompare(b.shift_date ?? ''),
    );

    expect(sorted.map((item) => item.id)).toEqual(['sooner', 'later']);
  });
});
