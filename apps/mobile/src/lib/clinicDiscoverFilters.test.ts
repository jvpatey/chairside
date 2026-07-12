import type { LiveJobPost, LiveShiftPost } from '@chairside/api';
import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CLINIC_DISCOVER_FILTERS,
  filterClinicDiscoverJobs,
  filterClinicDiscoverShifts,
} from './clinicDiscoverFilters';

const viewerClinic = {
  id: 'viewer-clinic',
  clinic_name: 'Viewer Clinic',
  province: 'NS',
  latitude: 44.65,
  longitude: -63.57,
} as const;

function makeJob(overrides: Partial<LiveJobPost> = {}): LiveJobPost {
  return {
    id: 'job-1',
    clinic_id: 'clinic-2',
    title: 'Dental Hygienist',
    role_type: 'dental_hygienist',
    employment_type: 'permanent',
    status: 'live',
    created_at: '2026-01-10T12:00:00.000Z',
    clinic: {
      clinic_id: 'clinic-2',
      clinic_name: 'Harbour Dental',
      city: 'Halifax',
      province: 'NS',
      specialty: 'general',
      software_used: ['dentrix'],
      latitude: 44.67,
      longitude: -63.6,
      logo_storage_path: null,
    },
    screening_questions: [],
    has_priority_listing: false,
    ...overrides,
  } as LiveJobPost;
}

function makeShift(overrides: Partial<LiveShiftPost> = {}): LiveShiftPost {
  return {
    id: 'shift-1',
    clinic_id: 'clinic-2',
    role_type: 'dental_assistant',
    status: 'live',
    shift_date: '2026-02-01',
    start_time: '09:00',
    end_time: '17:00',
    urgency: 'standard',
    created_at: '2026-01-10T12:00:00.000Z',
    clinic: {
      clinic_id: 'clinic-2',
      clinic_name: 'Harbour Dental',
      city: 'Halifax',
      province: 'NS',
      specialty: 'general',
      software_used: ['dentrix'],
      latitude: 44.67,
      longitude: -63.6,
      logo_storage_path: null,
    },
    has_priority_listing: false,
    ...overrides,
  } as LiveShiftPost;
}

describe('filterClinicDiscoverJobs', () => {
  it('filters by search query and role type', () => {
    const jobs = [
      makeJob(),
      makeJob({
        id: 'job-2',
        title: 'Front Desk Coordinator',
        role_type: 'front_desk',
      }),
    ];

    const filtered = filterClinicDiscoverJobs(jobs, viewerClinic, {
      ...DEFAULT_CLINIC_DISCOVER_FILTERS,
      searchQuery: 'hygienist',
      roleTypeFilter: 'dental_hygienist',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('job-1');
    expect(filtered[0]?.distanceLabel).toMatch(/km away/);
  });
});

describe('filterClinicDiscoverShifts', () => {
  it('filters by search query and role type', () => {
    const shifts = [
      makeShift(),
      makeShift({
        id: 'shift-2',
        role_type: 'dental_hygienist',
      }),
    ];

    const filtered = filterClinicDiscoverShifts(shifts, viewerClinic, {
      ...DEFAULT_CLINIC_DISCOVER_FILTERS,
      searchQuery: 'assistant',
      roleTypeFilter: 'dental_assistant',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('shift-1');
  });
});
