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
