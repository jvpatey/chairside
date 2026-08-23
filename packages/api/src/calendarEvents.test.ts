import { beforeEach, describe, expect, it, vi } from 'vitest';

const listClinicApplications = vi.fn();
const listShiftPosts = vi.fn();

vi.mock('./applications', () => ({
  listClinicApplications: (...args: unknown[]) => listClinicApplications(...args),
  listWorkerApplications: vi.fn(),
}));

vi.mock('./posts', () => ({
  listShiftPosts: (...args: unknown[]) => listShiftPosts(...args),
  isEmptyLocationScope: (locationIds?: string[] | 'all') =>
    Array.isArray(locationIds) && locationIds.length === 0,
}));

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          eq: async () => ({ data: [], error: null }),
        }),
      }),
    }),
  }),
}));

import { listClinicCalendarEvents } from './calendarEvents';

describe('listClinicCalendarEvents', () => {
  beforeEach(() => {
    listClinicApplications.mockReset();
    listClinicApplications.mockResolvedValue([]);
    listShiftPosts.mockReset();
    listShiftPosts.mockResolvedValue([]);
  });

  it('returns empty when location scope is an empty array', async () => {
    const events = await listClinicCalendarEvents('org-1', undefined, { locationIds: [] });
    expect(events).toEqual([]);
    expect(listClinicApplications).not.toHaveBeenCalled();
  });

  it('forwards locationIds to listClinicApplications', async () => {
    await listClinicCalendarEvents('org-1', undefined, { locationIds: ['loc-1', 'loc-2'] });
    expect(listClinicApplications).toHaveBeenCalledWith('org-1', 'active', {
      locationIds: ['loc-1', 'loc-2'],
    });
  });

  it('loads org-wide applications when locationIds is omitted', async () => {
    await listClinicCalendarEvents('org-1');
    expect(listClinicApplications).toHaveBeenCalledWith('org-1', 'active', undefined);
    expect(listShiftPosts).toHaveBeenCalledWith('org-1', undefined);
  });

  it('includes live upcoming shift posts as open fill-in events', async () => {
    const today = new Date().toISOString().slice(0, 10);
    listShiftPosts.mockResolvedValue([
      {
        id: 'shift-1',
        role_type: 'dental_hygienist',
        shift_date: today,
        start_time: '08:00',
        end_time: '17:00',
        location_id: 'loc-1',
        status: 'live',
      },
      {
        id: 'shift-2',
        role_type: 'dental_assistant',
        shift_date: '2000-01-01',
        start_time: '08:00',
        end_time: '17:00',
        location_id: null,
        status: 'live',
      },
      {
        id: 'shift-3',
        role_type: 'dental_assistant',
        shift_date: today,
        start_time: '08:00',
        end_time: '17:00',
        location_id: null,
        status: 'filled',
      },
    ]);

    const events = await listClinicCalendarEvents('org-1');
    expect(events).toHaveLength(1);
    expect(events[0]?.kind).toBe('open_fill_in');
    expect(events[0]?.shiftPostId).toBe('shift-1');
    expect(events[0]?.applicationId).toBeNull();
  });
});
