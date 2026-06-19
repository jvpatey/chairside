import type { WorkerMapClinicGroup, WorkerMapItem } from '@/lib/workerMapItems';
import type { MapCoordinate } from '@/lib/workerMapRegion';

export type WorkerBrowseMapProps = {
  groups: WorkerMapClinicGroup[];
  workerCoords: MapCoordinate | null;
  province: string;
  unmappableCount: number;
  workerHasCoordinates: boolean;
  onSelectItem: (item: WorkerMapItem) => void;
};
