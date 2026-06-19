export type MapCoordinate = {
  latitude: number;
  longitude: number;
};

export type MapBounds = {
  ne: MapCoordinate;
  sw: MapCoordinate;
};

const PROVINCE_CENTERS: Record<string, MapCoordinate> = {
  NS: { latitude: 44.6488, longitude: -63.5752 },
  NB: { latitude: 45.9636, longitude: -66.6431 },
  PE: { latitude: 46.2382, longitude: -63.1311 },
  NL: { latitude: 47.5615, longitude: -52.7126 },
  ON: { latitude: 43.6532, longitude: -79.3832 },
  QC: { latitude: 46.8139, longitude: -71.208 },
  BC: { latitude: 49.2827, longitude: -123.1216 },
  AB: { latitude: 53.5461, longitude: -113.4909 },
  SK: { latitude: 50.4452, longitude: -104.6067 },
  MB: { latitude: 49.8954, longitude: -97.1384 },
};

const DEFAULT_CENTER = PROVINCE_CENTERS.NS;
const DEFAULT_ZOOM = 8;

export function getProvinceMapCenter(province: string | null | undefined): MapCoordinate {
  if (!province) return DEFAULT_CENTER;
  return PROVINCE_CENTERS[province] ?? DEFAULT_CENTER;
}

export function getWorkerMapCenter(
  workerCoords: MapCoordinate | null | undefined,
  province: string | null | undefined,
): MapCoordinate {
  return workerCoords ?? getProvinceMapCenter(province);
}

export function getDefaultMapZoom(): number {
  return DEFAULT_ZOOM;
}

export function buildMapBoundsFromCoordinates(
  coordinates: MapCoordinate[],
): MapBounds | null {
  if (coordinates.length === 0) return null;

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  for (const coordinate of coordinates) {
    minLat = Math.min(minLat, coordinate.latitude);
    maxLat = Math.max(maxLat, coordinate.latitude);
    minLng = Math.min(minLng, coordinate.longitude);
    maxLng = Math.max(maxLng, coordinate.longitude);
  }

  const latPadding = Math.max((maxLat - minLat) * 0.15, 0.05);
  const lngPadding = Math.max((maxLng - minLng) * 0.15, 0.05);

  return {
    ne: {
      latitude: maxLat + latPadding,
      longitude: maxLng + lngPadding,
    },
    sw: {
      latitude: minLat - latPadding,
      longitude: minLng - lngPadding,
    },
  };
}
