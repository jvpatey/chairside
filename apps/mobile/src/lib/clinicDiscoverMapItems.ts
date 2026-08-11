import type { EnrichedClinicDiscoverJob, EnrichedClinicDiscoverShift } from '@/lib/clinicDiscoverFilters';
import {
  groupWorkerMapItemsByClinic,
  liveJobToMapItem,
  liveShiftToMapItem,
  type WorkerMapClinicGroup,
  type WorkerMapItem,
} from '@/lib/workerMapItems';

const EMPTY_IDS = new Set<string>();

/** Map discover role listings into worker map items (no saved/applied/match state). */
export function toDiscoverMapItemsFromJobs(
  jobs: EnrichedClinicDiscoverJob[],
): WorkerMapItem[] {
  return jobs
    .map((job) => liveJobToMapItem({ ...job, matchTier: null }, EMPTY_IDS, EMPTY_IDS))
    .filter((item): item is WorkerMapItem => item != null);
}

/** Map discover fill-in listings into worker map items. */
export function toDiscoverMapItemsFromShifts(
  shifts: EnrichedClinicDiscoverShift[],
): WorkerMapItem[] {
  return shifts
    .map((shift) => liveShiftToMapItem(shift, EMPTY_IDS))
    .filter((item): item is WorkerMapItem => item != null);
}

export function groupDiscoverMapItemsByClinic(items: WorkerMapItem[]): WorkerMapClinicGroup[] {
  return groupWorkerMapItemsByClinic(items);
}
