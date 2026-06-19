import { Platform } from 'react-native';
import type { ComponentType } from 'react';

type MapboxDefault = {
  setAccessToken: (token: string) => void;
  setTelemetryEnabled: (enabled: boolean) => void;
  StyleURL: {
    Dark: string;
    Street: string;
  };
};

export type MapboxRuntimeModule = {
  default: MapboxDefault;
  MapView: ComponentType<Record<string, unknown>>;
  Camera: ComponentType<Record<string, unknown>>;
  MarkerView: ComponentType<Record<string, unknown>>;
};

let cachedMapboxModule: MapboxRuntimeModule | null | undefined;
let mapboxInitialized = false;

export function getMapboxAccessToken(): string | null {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  return token || null;
}

export function isMapboxMapSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function loadMapboxModule(): MapboxRuntimeModule | null {
  if (!isMapboxMapSupported()) return null;
  if (cachedMapboxModule !== undefined) return cachedMapboxModule;

  try {
    // Lazy load so Expo Go can import browse routes without crashing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedMapboxModule = require('@rnmapbox/maps') as MapboxRuntimeModule;
    return cachedMapboxModule;
  } catch {
    cachedMapboxModule = null;
    return null;
  }
}

export function isMapboxNativeModuleAvailable(): boolean {
  return loadMapboxModule() != null;
}

export function canRenderWorkerMap(): boolean {
  return isMapboxMapSupported() && Boolean(getMapboxAccessToken()) && isMapboxNativeModuleAvailable();
}

export function initializeMapbox(): boolean {
  if (mapboxInitialized) return isMapboxNativeModuleAvailable();

  const token = getMapboxAccessToken();
  const maps = loadMapboxModule();
  if (!token || !maps) return false;

  maps.default.setAccessToken(token);
  maps.default.setTelemetryEnabled(false);
  mapboxInitialized = true;
  return true;
}
