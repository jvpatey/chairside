import { describe, expect, it } from 'vitest';

import {
  addDaysIso,
  buildLocationGlanceRows,
  buildTeamPulseCounts,
  buildWeekCoverageRows,
  formatLocationGlanceCounts,
} from './groupDashboardMetrics';

const locations = [
  {
    id: 'loc-a',
    name: 'Dental Group - Sackville',
    city: 'Lower Sackville',
    province: 'NS',
    logo_storage_path: 'logos/a.jpg',
  },
  {
    id: 'loc-b',
    name: 'Dental Group - Bedford',
    city: 'Bedford',
    province: 'NS',
    logo_storage_path: null,
  },
];

describe('groupDashboardMetrics', () => {
  it('aggregates open fill-ins, roles, and pending apps per location', () => {
    const rows = buildLocationGlanceRows({
      locations,
      today: '2026-08-16',
      jobs: [
        { id: 'job-1', location_id: 'loc-a', status: 'live' },
        { id: 'job-2', location_id: 'loc-a', status: 'paused' },
        { id: 'job-3', location_id: 'loc-b', status: 'live' },
        { id: 'job-4', location_id: null, status: 'live' },
      ],
      shifts: [
        { id: 'shift-1', location_id: 'loc-a', status: 'live', shift_date: '2026-08-16' },
        { id: 'shift-2', location_id: 'loc-a', status: 'live', shift_date: '2026-08-10' },
        { id: 'shift-3', location_id: 'loc-b', status: 'filled', shift_date: '2026-08-17' },
        { id: 'shift-4', location_id: 'loc-b', status: 'live', shift_date: '2026-08-20' },
      ],
      applications: [
        { id: 'app-1', status: 'submitted', job_post_id: 'job-1', shift_post_id: null },
        { id: 'app-2', status: 'hired', job_post_id: 'job-1', shift_post_id: null },
        { id: 'app-3', status: 'applied', job_post_id: null, shift_post_id: 'shift-4' },
        { id: 'app-4', status: 'submitted', job_post_id: 'missing', shift_post_id: null },
      ],
    });

    expect(rows).toEqual([
      {
        locationId: 'loc-a',
        name: 'Dental Group - Sackville',
        city: 'Lower Sackville',
        province: 'NS',
        logoStoragePath: 'logos/a.jpg',
        openFillIns: 1,
        openRoles: 1,
        pendingApplications: 1,
      },
      {
        locationId: 'loc-b',
        name: 'Dental Group - Bedford',
        city: 'Bedford',
        province: 'NS',
        logoStoragePath: null,
        openFillIns: 1,
        openRoles: 1,
        pendingApplications: 1,
      },
    ]);
  });

  it('builds week coverage for live fill-ins in the next 7 days', () => {
    const today = '2026-08-16';
    expect(addDaysIso(today, 7)).toBe('2026-08-23');

    const rows = buildWeekCoverageRows({
      locations,
      today,
      shifts: [
        { id: 's1', location_id: 'loc-a', status: 'live', shift_date: '2026-08-18' },
        { id: 's2', location_id: 'loc-a', status: 'live', shift_date: '2026-08-17' },
        { id: 's3', location_id: 'loc-b', status: 'live', shift_date: '2026-08-22' },
        { id: 's4', location_id: 'loc-b', status: 'live', shift_date: '2026-08-23' },
        { id: 's5', location_id: 'loc-a', status: 'filled', shift_date: '2026-08-19' },
        { id: 's6', location_id: null, status: 'live', shift_date: '2026-08-18' },
      ],
    });

    expect(rows).toEqual([
      {
        locationId: 'loc-a',
        name: 'Dental Group - Sackville',
        city: 'Lower Sackville',
        logoStoragePath: 'logos/a.jpg',
        unfilledCount: 2,
        nearestShiftDate: '2026-08-17',
      },
      {
        locationId: 'loc-b',
        name: 'Dental Group - Bedford',
        city: 'Bedford',
        logoStoragePath: null,
        unfilledCount: 1,
        nearestShiftDate: '2026-08-22',
      },
    ]);
  });

  it('filters week coverage to a single location when scoped', () => {
    const rows = buildWeekCoverageRows({
      locations,
      today: '2026-08-16',
      locationIdFilter: 'loc-b',
      shifts: [
        { id: 's1', location_id: 'loc-a', status: 'live', shift_date: '2026-08-17' },
        { id: 's2', location_id: 'loc-b', status: 'live', shift_date: '2026-08-18' },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]?.locationId).toBe('loc-b');
  });

  it('assigns null location_id shifts to a fallback practice id', () => {
    const rows = buildWeekCoverageRows({
      locations: [
        {
          id: 'practice-1',
          name: 'Smile Dental',
          city: 'Halifax',
          logo_storage_path: null,
        },
      ],
      today: '2026-08-16',
      fallbackLocationId: 'practice-1',
      shifts: [
        { id: 's1', location_id: null, status: 'live', shift_date: '2026-08-18' },
        { id: 's2', location_id: null, status: 'live', shift_date: '2026-08-19' },
      ],
    });

    expect(rows).toEqual([
      {
        locationId: 'practice-1',
        name: 'Smile Dental',
        city: 'Halifax',
        logoStoragePath: null,
        unfilledCount: 2,
        nearestShiftDate: '2026-08-18',
      },
    ]);
  });

  it('formats glance count labels', () => {
    expect(
      formatLocationGlanceCounts({
        locationId: 'x',
        name: 'X',
        city: null,
        province: null,
        logoStoragePath: null,
        openFillIns: 2,
        openRoles: 1,
        pendingApplications: 3,
      }),
    ).toBe('2 fill-ins · 1 role · 3 apps');

    expect(
      formatLocationGlanceCounts({
        locationId: 'x',
        name: 'X',
        city: null,
        province: null,
        logoStoragePath: null,
        openFillIns: 0,
        openRoles: 0,
        pendingApplications: 0,
      }),
    ).toBe('No open activity');
  });

  it('counts pending invites and unassigned managers only', () => {
    expect(
      buildTeamPulseCounts({
        invitations: [
          { status: 'pending' },
          { status: 'pending' },
          { status: 'accepted' },
        ],
        memberships: [
          { role: 'owner', status: 'active', location_ids: [] },
          { role: 'manager', status: 'active', location_ids: [] },
          { role: 'manager', status: 'active', location_ids: ['loc-a'] },
          { role: 'manager', status: 'removed', location_ids: [] },
        ],
      }),
    ).toEqual({ pendingInvites: 2, unassignedManagers: 1 });
  });
});
