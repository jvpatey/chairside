import { describe, expect, it } from 'vitest';

import type { EnrichedLiveJobPost, EnrichedLiveShiftPost } from '@/lib/workerBrowseFilters';
import {
  countUnmappablePosts,
  groupWorkerMapItemsByClinic,
  hasMappableClinicCoordinates,
  liveJobToMapItem,
  liveShiftToMapItem,
  toWorkerMapItemsFromJobs,
  toWorkerMapItemsFromShifts,
} from '@/lib/workerMapItems';
import { buildMapBoundsFromCoordinates, getProvinceMapCenter } from '@/lib/workerMapRegion';

function buildClinic(overrides: Partial<EnrichedLiveJobPost['clinic']> = {}) {
  return {
    clinic_id: 'clinic-1',
    clinic_name: 'Harbour Dental',
    city: 'Halifax',
    province: 'NS',
    specialty: 'General',
    software_used: ['Dentrix'],
    latitude: 44.65,
    longitude: -63.58,
    logo_storage_path: null,
    ...overrides,
  };
}

function buildJob(overrides: Partial<EnrichedLiveJobPost> = {}): EnrichedLiveJobPost {
  return {
    id: 'job-1',
    clinic_id: 'clinic-1',
    role_type: 'hygienist',
    employment_type: 'permanent',
    title: 'Dental Hygienist',
    wage_range: '$45-55/hr',
    schedule: null,
    description: null,
    required_qualifications: [],
    preferred_qualifications: [],
    specialty: 'General',
    software_used: [],
    start_date: null,
    benefits: null,
    offerings: [],
    screening_enabled: false,
    status: 'live',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    clinic: buildClinic(),
    screening_questions: [],
    has_priority_listing: false,
    distanceKm: 4.2,
    distanceLabel: '4.2 km away',
    matchTier: 'good',
    ...overrides,
  };
}

function buildShift(overrides: Partial<EnrichedLiveShiftPost> = {}): EnrichedLiveShiftPost {
  return {
    id: 'shift-1',
    clinic_id: 'clinic-1',
    role_type: 'assistant',
    shift_date: '2026-06-20',
    start_time: '09:00',
    end_time: '17:00',
    compensation: '$250/day',
    urgency: 'normal',
    description: null,
    status: 'live',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    clinic: buildClinic({ clinic_id: 'clinic-1' }),
    has_priority_listing: false,
    distanceKm: 8,
    distanceLabel: '8 km away',
    ...overrides,
  };
}

describe('hasMappableClinicCoordinates', () => {
  it('returns true when latitude and longitude are present', () => {
    expect(hasMappableClinicCoordinates(buildClinic())).toBe(true);
  });

  it('returns false when coordinates are missing', () => {
    expect(hasMappableClinicCoordinates(buildClinic({ latitude: null, longitude: null }))).toBe(
      false,
    );
  });
});

describe('liveJobToMapItem', () => {
  it('maps enriched jobs with role, title, pay, and saved/applied state', () => {
    const item = liveJobToMapItem(buildJob(), new Set(['job-1']), new Set(['job-1']));
    expect(item).toMatchObject({
      kind: 'job',
      id: 'job-1',
      clinicName: 'Harbour Dental',
      roleLabel: 'Dental Hygienist',
      title: 'Dental Hygienist',
      pay: '$45-55/hr',
      isSaved: true,
      hasApplied: true,
      matchTier: 'good',
    });
  });

  it('returns null when clinic coordinates are missing', () => {
    const item = liveJobToMapItem(
      buildJob({ clinic: buildClinic({ latitude: null, longitude: null }) }),
      new Set(),
      new Set(),
    );
    expect(item).toBeNull();
  });
});

describe('liveShiftToMapItem', () => {
  it('maps enriched shifts with role label, title, and pay', () => {
    const item = liveShiftToMapItem(buildShift(), new Set(['shift-1']));
    expect(item).toMatchObject({
      kind: 'shift',
      roleLabel: 'Dental Assistant',
      title: 'Dental Assistant',
      pay: '$250/day',
      isSaved: true,
    });
  });
});

describe('groupWorkerMapItemsByClinic', () => {
  it('groups multiple posts at the same clinic into one pin', () => {
    const items = toWorkerMapItemsFromJobs(
      [
        buildJob({ id: 'job-1' }),
        buildJob({
          id: 'job-2',
          title: 'Office Manager',
          clinic: buildClinic({ clinic_id: 'clinic-1' }),
        }),
        buildJob({
          id: 'job-3',
          clinic: buildClinic({
            clinic_id: 'clinic-2',
            clinic_name: 'South End Dental',
            latitude: 44.62,
            longitude: -63.6,
          }),
          distanceKm: 12,
          distanceLabel: '12 km away',
        }),
      ],
      new Set(['job-2']),
      new Set(['job-1']),
    );

    const groups = groupWorkerMapItemsByClinic(items);
    expect(groups).toHaveLength(2);
    expect(groups[0].clinicId).toBe('clinic-1');
    expect(groups[0].items).toHaveLength(2);
    expect(groups[0].jobCount).toBe(2);
    expect(groups[0].hasSaved).toBe(true);
    expect(groups[0].hasApplied).toBe(true);
    expect(groups[0].logoStoragePath).toBeNull();
  });

  it('groups jobs and shifts together for one clinic', () => {
    const jobItems = toWorkerMapItemsFromJobs([buildJob()], new Set(), new Set());
    const shiftItems = toWorkerMapItemsFromShifts([buildShift({ id: 'shift-2' })], new Set());
    const groups = groupWorkerMapItemsByClinic([...jobItems, ...shiftItems]);

    expect(groups).toHaveLength(1);
    expect(groups[0].jobCount).toBe(1);
    expect(groups[0].shiftCount).toBe(1);
    expect(groups[0].items).toHaveLength(2);
  });
});

describe('countUnmappablePosts', () => {
  it('counts posts missing clinic coordinates', () => {
    const count = countUnmappablePosts([
      buildJob(),
      buildJob({ clinic: buildClinic({ latitude: null, longitude: null }) }),
      buildShift(),
    ]);
    expect(count).toBe(1);
  });
});

describe('workerMapRegion', () => {
  it('returns province centers with NS fallback', () => {
    expect(getProvinceMapCenter('NS')).toEqual({ latitude: 44.6488, longitude: -63.5752 });
    expect(getProvinceMapCenter('ZZ')).toEqual(getProvinceMapCenter('NS'));
  });

  it('builds padded bounds from coordinates', () => {
    const bounds = buildMapBoundsFromCoordinates([
      { latitude: 44.65, longitude: -63.58 },
      { latitude: 44.7, longitude: -63.5 },
    ]);
    expect(bounds?.ne.latitude).toBeGreaterThan(44.7);
    expect(bounds?.sw.longitude).toBeLessThan(-63.58);
  });
});
