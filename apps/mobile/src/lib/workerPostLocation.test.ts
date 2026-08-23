import { describe, expect, it } from 'vitest';

import {
  formatWorkerListingCardLocation,
  formatWorkerPostLocation,
  resolveWorkerPostLocationParts,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';

const clinic = {
  clinic_id: 'clinic-1',
  clinic_name: 'Smile Group',
  city: 'Halifax',
  province: 'NS',
  specialty: 'general',
  software_used: [],
  latitude: null,
  longitude: null,
  logo_storage_path: 'org-logo',
};

describe('resolveWorkerPostLocationParts', () => {
  it('splits site name and geographic place for detail headers', () => {
    expect(
      resolveWorkerPostLocationParts({
        clinic,
        location: {
          id: 'loc-1',
          name: 'Downtown',
          city: 'Halifax',
          province: 'NS',
          logo_storage_path: null,
        },
      }),
    ).toEqual({
      displayName: 'Downtown',
      placeLabel: 'Halifax, NS',
    });
  });

  it('falls back to clinic name and city when no location is attached', () => {
    expect(resolveWorkerPostLocationParts({ clinic })).toEqual({
      displayName: 'Smile Group',
      placeLabel: 'Halifax, NS',
    });
  });
});

describe('formatWorkerPostLocation', () => {
  it('uses site name when a location is attached', () => {
    expect(
      formatWorkerPostLocation({
        clinic,
        location: {
          id: 'loc-1',
          name: 'Downtown',
          city: 'Halifax',
          province: 'NS',
          logo_storage_path: null,
        },
      }),
    ).toBe('Downtown · Halifax, NS');
  });

  it('falls back to clinic city when no location is attached', () => {
    expect(formatWorkerPostLocation({ clinic })).toBe('Halifax, NS');
  });

  it('appends distance when provided', () => {
    expect(formatWorkerPostLocation({ clinic }, '2 km')).toBe('Halifax, NS • 2 km');
  });
});

describe('formatWorkerListingCardLocation', () => {
  it('shows geographic place only, not site or clinic name', () => {
    expect(
      formatWorkerListingCardLocation({
        clinic,
        location: {
          id: 'loc-1',
          name: 'Downtown',
          city: 'Halifax',
          province: 'NS',
          logo_storage_path: null,
        },
      }),
    ).toBe('Halifax, NS');
  });

  it('appends distance when provided', () => {
    expect(formatWorkerListingCardLocation({ clinic }, '2 km')).toBe('Halifax, NS • 2 km');
  });
});

describe('resolveWorkerPostLogoStoragePath', () => {
  it('prefers location logo over clinic logo', () => {
    expect(
      resolveWorkerPostLogoStoragePath({
        clinic,
        location: {
          id: 'loc-1',
          name: 'Downtown',
          city: 'Halifax',
          province: 'NS',
          logo_storage_path: 'loc-logo',
        },
      }),
    ).toBe('loc-logo');
  });
});
