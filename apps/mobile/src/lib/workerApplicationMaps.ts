import type { WorkerApplication } from '@chairside/api';

import type { MapsDestination } from '@/lib/mapsDirectionsUrls';

type WorkerApplicationClinicLocationFields = Pick<
  WorkerApplication,
  | 'clinic_location'
  | 'clinic_address'
  | 'clinic_city'
  | 'clinic_province'
  | 'clinic_latitude'
  | 'clinic_longitude'
  | 'clinic_account_deleted'
>;

export function getWorkerApplicationClinicLocationLabel(
  application: WorkerApplicationClinicLocationFields,
): string | null {
  if (application.clinic_account_deleted) return null;

  return (
    application.clinic_location ??
    ([application.clinic_address, application.clinic_city, application.clinic_province]
      .filter(Boolean)
      .join(' · ') || null)
  );
}

export function getWorkerApplicationMapsDestination(
  application: WorkerApplicationClinicLocationFields,
): MapsDestination | null {
  if (application.clinic_account_deleted) return null;

  const label = getWorkerApplicationClinicLocationLabel(application);
  const hasCoordinates =
    application.clinic_latitude != null && application.clinic_longitude != null;

  if (!label && !hasCoordinates) return null;

  return {
    latitude: application.clinic_latitude,
    longitude: application.clinic_longitude,
    label,
  };
}

export function hasMappableWorkerApplicationClinicLocation(
  application: WorkerApplicationClinicLocationFields,
): boolean {
  return getWorkerApplicationMapsDestination(application) != null;
}
