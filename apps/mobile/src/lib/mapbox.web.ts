export type MapboxRuntimeModule = typeof import('@rnmapbox/maps');

export function getMapboxAccessToken(): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  return token || null;
}

export function isMapboxMapSupported(): boolean {
  return true;
}

export function loadMapboxModule(): MapboxRuntimeModule | null {
  return null;
}

export function isMapboxNativeModuleAvailable(): boolean {
  return Boolean(getMapboxAccessToken());
}

export function canRenderWorkerMap(): boolean {
  return Boolean(getMapboxAccessToken());
}

export function initializeMapbox(): boolean {
  return Boolean(getMapboxAccessToken());
}
