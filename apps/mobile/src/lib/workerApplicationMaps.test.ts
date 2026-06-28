import { describe, expect, it } from 'vitest';

import {
  getWorkerApplicationClinicLocationLabel,
  getWorkerApplicationMapsDestination,
  hasMappableWorkerApplicationClinicLocation,
} from '@/lib/workerApplicationMaps';

const baseApplication = {
  clinic_location: '123 Main St · Halifax, NS',
  clinic_address: '123 Main St',
  clinic_city: 'Halifax',
  clinic_province: 'NS',
  clinic_latitude: 44.6488,
  clinic_longitude: -63.5752,
  clinic_account_deleted: false,
};

describe('workerApplicationMaps', () => {
  it('builds a maps destination from clinic location fields', () => {
    expect(getWorkerApplicationClinicLocationLabel(baseApplication)).toBe(
      '123 Main St · Halifax, NS',
    );
    expect(getWorkerApplicationMapsDestination(baseApplication)).toEqual({
      latitude: 44.6488,
      longitude: -63.5752,
      label: '123 Main St · Halifax, NS',
    });
    expect(hasMappableWorkerApplicationClinicLocation(baseApplication)).toBe(true);
  });

  it('returns null when the clinic account was deleted', () => {
    expect(
      hasMappableWorkerApplicationClinicLocation({
        ...baseApplication,
        clinic_account_deleted: true,
      }),
    ).toBe(false);
  });
});
