import mapboxgl from 'mapbox-gl';
import { createElement, useCallback, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { View } from 'react-native';

import { getMapboxAccessToken } from '@/lib/mapbox';
import { useTheme, useThemedStyles } from '@/theme';

const PREVIEW_HEIGHT = 168;
const PREVIEW_ZOOM = 14;

const MAP_STYLE = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12',
} as const;

const MAP_DIV_STYLE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
};

type ClinicLocationMapPreviewProps = {
  latitude: number;
  longitude: number;
};

export function ClinicLocationMapPreview({
  latitude,
  longitude,
}: ClinicLocationMapPreviewProps) {
  const { isDark, colors } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const styles = useThemedStyles(({ colors }) => ({
    shell: {
      height: PREVIEW_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
      position: 'relative',
    },
  }));

  const handleContainer = useCallback((element: HTMLDivElement | null) => {
    mapContainerRef.current = element;
  }, []);

  useEffect(() => {
    const accessToken = getMapboxAccessToken();
    const container = mapContainerRef.current;
    if (!accessToken || !container || mapRef.current) return;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container,
      style: isDark ? MAP_STYLE.dark : MAP_STYLE.light,
      center: [longitude, latitude],
      zoom: PREVIEW_ZOOM,
      interactive: false,
      attributionControl: false,
    });

    map.on('load', () => {
      container.querySelector('.mapboxgl-ctrl-logo')?.remove();
    });

    const markerElement = document.createElement('div');
    markerElement.style.width = '16px';
    markerElement.style.height = '16px';
    markerElement.style.borderRadius = '8px';
    markerElement.style.backgroundColor = colors.primary;
    markerElement.style.border = `2px solid ${colors.surface}`;
    markerElement.style.boxShadow = '0 1px 4px rgba(0,0,0,0.25)';

    markerRef.current = new mapboxgl.Marker({ element: markerElement, anchor: 'center' })
      .setLngLat([longitude, latitude])
      .addTo(map);

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [colors.primary, colors.surface, isDark, latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.setStyle(isDark ? MAP_STYLE.dark : MAP_STYLE.light);
    map.jumpTo({ center: [longitude, latitude], zoom: PREVIEW_ZOOM });
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [isDark, latitude, longitude]);

  if (!getMapboxAccessToken()) {
    return <View style={styles.shell} />;
  }

  return (
    <View style={styles.shell}>
      {createElement('div', { ref: handleContainer, style: MAP_DIV_STYLE })}
    </View>
  );
}
