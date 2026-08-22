import { beforeEach, describe, expect, it, vi } from 'vitest';

const listClinicApplications = vi.fn();

vi.mock('./applications', () => ({
  listClinicApplications: (...args: unknown[]) => listClinicApplications(...args),
  listWorkerApplications: vi.fn(),
}));

vi.mock('./client', () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        in: async () => ({ data: [], error: null }),
      }),
    }),
  }),
}));

import { listClinicCalendarEvents } from './calendarEvents';

describe('listClinicCalendarEvents', () => {
  beforeEach(() => {
    listClinicApplications.mockReset();
    listClinicApplications.mockResolvedValue([]);
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
  });
});
