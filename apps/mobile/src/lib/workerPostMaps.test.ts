import { describe, expect, it } from 'vitest';

import { getWorkerPostMapsDestination } from '@/lib/workerPostMaps';

const clinic = {
  clinic_id: 'c1',
  clinic_name: 'Harbour Dental',
  city: 'Halifax',
  province: 'NS',
  specialty: 'general',
  software_used: [] as string[],
  latitude: 44.6488,
  longitude: -63.5752,
  logo_storage_path: null,
};

describe('getWorkerPostMapsDestination', () => {
  it('builds a destination when coordinates exist', () => {
    expect(getWorkerPostMapsDestination({ clinic })).toEqual({
      latitude: 44.6488,
      longitude: -63.5752,
      label: 'Harbour Dental, Halifax, NS',
    });
  });

  it('returns null without coordinates', () => {
    expect(
      getWorkerPostMapsDestination({
        clinic: { ...clinic, latitude: null, longitude: null },
      }),
    ).toBeNull();
  });
});
