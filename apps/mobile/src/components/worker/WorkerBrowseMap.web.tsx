import mapboxgl from 'mapbox-gl';
import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StyleSheet, Text, View } from 'react-native';

import { WorkerMapClinicSheet } from '@/components/worker/WorkerMapClinicSheet';
import { WorkerMapPin, WorkerMapWorkerPin } from '@/components/worker/WorkerMapPin';
import { WorkerMapUnavailable } from '@/components/worker/WorkerMapUnavailable';
import { WorkerMapControls } from '@/components/worker/WorkerMapControls';
import type { WorkerBrowseMapProps } from '@/components/worker/workerBrowseMapTypes';
import { getMapboxAccessToken } from '@/lib/mapbox';
import type { WorkerMapClinicGroup, WorkerMapItem } from '@/lib/workerMapItems';
import {
  buildMapBoundsFromCoordinates,
  getDefaultMapZoom,
  getWorkerLocateZoom,
  getWorkerMapCenter,
} from '@/lib/workerMapRegion';
import { useTheme, useThemedStyles } from '@/theme';

export type { WorkerBrowseMapProps } from '@/components/worker/workerBrowseMapTypes';

const ZOOM_ANIMATION_MS = 200;
const LOCATE_ANIMATION_MS = 350;
const MAP_PADDING = 48;

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

type MarkerEntry = {
  marker: mapboxgl.Marker;
  root: Root;
};

function formatPinCount(group: WorkerMapClinicGroup): string {
  const total = group.items.length;
  return total > 9 ? '9+' : String(total);
}

function scheduleRootUnmount(root: Root) {
  queueMicrotask(() => {
    root.unmount();
  });
}

function clearMarkers(entries: MarkerEntry[]) {
  for (const entry of entries) {
    entry.marker.remove();
    scheduleRootUnmount(entry.root);
  }
  entries.length = 0;
}

function applyMapCamera(
  map: mapboxgl.Map,
  mapBounds: ReturnType<typeof buildMapBoundsFromCoordinates>,
  mapCenter: ReturnType<typeof getWorkerMapCenter>,
) {
  map.resize();

  if (mapBounds) {
    map.fitBounds(
      [
        [mapBounds.sw.longitude, mapBounds.sw.latitude],
        [mapBounds.ne.longitude, mapBounds.ne.latitude],
      ],
      { padding: MAP_PADDING, duration: 0 },
    );
    return;
  }

  map.jumpTo({
    center: [mapCenter.longitude, mapCenter.latitude],
    zoom: getDefaultMapZoom(),
  });
}

type MapContainerProps = {
  onElement: (element: HTMLDivElement | null) => void;
};

function MapContainer({ onElement }: MapContainerProps) {
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      onElement(node);
    },
    [onElement],
  );

  return createElement('div', { ref, style: MAP_DIV_STYLE });
}

export function WorkerBrowseMap({
  groups,
  workerCoords,
  province,
  unmappableCount,
  workerHasCoordinates,
  onSelectItem,
}: WorkerBrowseMapProps) {
  const { isDark } = useTheme();
  const accessToken = useMemo(() => getMapboxAccessToken(), []);
  const [selectedGroup, setSelectedGroup] = useState<WorkerMapClinicGroup | null>(null);
  const [mapContainerEl, setMapContainerEl] = useState<HTMLDivElement | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const clinicMarkersRef = useRef<MarkerEntry[]>([]);
  const workerMarkerRef = useRef<MarkerEntry | null>(null);
  const styleRef = useRef(MAP_STYLE.light);

  const mapCenter = useMemo(
    () => getWorkerMapCenter(workerCoords, province),
    [province, workerCoords],
  );

  const mapBounds = useMemo(
    () =>
      buildMapBoundsFromCoordinates(
        groups.map((group) => ({
          latitude: group.latitude,
          longitude: group.longitude,
        })),
      ),
    [groups],
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      width: '100%',
    },
    notices: {
      gap: spacing.sm,
      marginBottom: spacing.md,
      flexShrink: 0,
    },
    notice: {
      backgroundColor: colors.fillSubtle,
      borderRadius: 12,
      padding: spacing.md,
      gap: spacing.xs,
    },
    noticeTitle: {
      ...typography.subtitle,
      fontSize: 14,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    noticeBody: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    mapShell: {
      flex: 1,
      minHeight: 0,
      width: '100%',
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    mapOverlay: {
      ...StyleSheet.absoluteFillObject,
      pointerEvents: 'box-none',
    },
  }));

  const handleMapContainer = useCallback((element: HTMLDivElement | null) => {
    setMapContainerEl(element);
  }, []);

  const handleSelectItem = useCallback(
    (item: WorkerMapItem) => {
      setSelectedGroup(null);
      onSelectItem(item);
    },
    [onSelectItem],
  );

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn({ duration: ZOOM_ANIMATION_MS });
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut({ duration: ZOOM_ANIMATION_MS });
  }, []);

  const handleLocate = useCallback(() => {
    if (!workerCoords || !mapRef.current) return;
    mapRef.current.easeTo({
      center: [workerCoords.longitude, workerCoords.latitude],
      zoom: getWorkerLocateZoom(),
      duration: LOCATE_ANIMATION_MS,
    });
  }, [workerCoords]);

  useEffect(() => {
    if (!accessToken || !mapContainerEl || groups.length === 0 || mapRef.current) return;

    const nextStyle = isDark ? MAP_STYLE.dark : MAP_STYLE.light;
    styleRef.current = nextStyle;

    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainerEl,
      style: nextStyle,
      center: [mapCenter.longitude, mapCenter.latitude],
      zoom: getDefaultMapZoom(),
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: false }), 'top-right');

    const handleLoad = () => {
      mapContainerEl.querySelector('.mapboxgl-ctrl-logo')?.remove();
      applyMapCamera(map, mapBounds, mapCenter);
      setMapReady(true);
    };

    map.on('load', handleLoad);

    mapRef.current = map;
    const clinicMarkers = clinicMarkersRef.current;

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
    });
    resizeObserver.observe(mapContainerEl);

    return () => {
      resizeObserver.disconnect();
      setMapReady(false);
      clearMarkers(clinicMarkers);
      if (workerMarkerRef.current) {
        workerMarkerRef.current.marker.remove();
        scheduleRootUnmount(workerMarkerRef.current.root);
        workerMarkerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once per mount cycle.
  }, [accessToken, mapContainerEl, groups.length]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const nextStyle = isDark ? MAP_STYLE.dark : MAP_STYLE.light;
    if (styleRef.current === nextStyle) return;

    styleRef.current = nextStyle;
    map.setStyle(nextStyle);
    map.once('style.load', () => {
      applyMapCamera(map, mapBounds, mapCenter);
    });
  }, [isDark, mapBounds, mapCenter, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    applyMapCamera(map, mapBounds, mapCenter);
  }, [mapBounds, mapCenter, mapReady, groups]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    clearMarkers(clinicMarkersRef.current);

    for (const group of groups) {
      const element = document.createElement('div');
      const root = createRoot(element);
      root.render(
        <WorkerMapPin
          label={formatPinCount(group)}
          saved={group.hasSaved}
          onPress={() => setSelectedGroup(group)}
        />,
      );

      const marker = new mapboxgl.Marker({ element, anchor: 'center' })
        .setLngLat([group.longitude, group.latitude])
        .addTo(map);

      clinicMarkersRef.current.push({ marker, root });
    }
  }, [groups, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (workerMarkerRef.current) {
      workerMarkerRef.current.marker.remove();
      scheduleRootUnmount(workerMarkerRef.current.root);
      workerMarkerRef.current = null;
    }

    if (!workerCoords) return;

    const element = document.createElement('div');
    const root = createRoot(element);
    root.render(<WorkerMapWorkerPin />);

    const marker = new mapboxgl.Marker({ element, anchor: 'center' })
      .setLngLat([workerCoords.longitude, workerCoords.latitude])
      .addTo(map);

    workerMarkerRef.current = { marker, root };
  }, [mapReady, workerCoords]);

  if (!accessToken) {
    return (
      <View style={styles.root}>
        <WorkerMapUnavailable
          title="Map unavailable"
          body="Add a Mapbox access token to enable the map view. List view still works."
        />
      </View>
    );
  }

  if (groups.length === 0) {
    return (
      <View style={styles.root}>
        <WorkerMapUnavailable
          title="No mappable clinics"
          body={
            unmappableCount > 0
              ? 'These postings match your filters, but their clinics do not have map coordinates yet. Try list view or adjust filters.'
              : 'No clinics with map coordinates match your current filters.'
          }
          icon="location-outline"
        />
      </View>
    );
  }

  const showNotices = !workerHasCoordinates || unmappableCount > 0;

  return (
    <View style={styles.root}>
      {showNotices ? (
        <View style={styles.notices}>
          {!workerHasCoordinates ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Showing your province</Text>
              <Text style={styles.noticeBody}>
                Add your worker address in profile setup to center the map near you and improve
                distance sorting.
              </Text>
            </View>
          ) : null}
          {unmappableCount > 0 ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>
                {unmappableCount} posting{unmappableCount === 1 ? '' : 's'} hidden from map
              </Text>
              <Text style={styles.noticeBody}>
                Some clinics are missing coordinates. Switch to list view to see every matching
                posting.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={styles.mapShell} collapsable={false}>
        <MapContainer onElement={handleMapContainer} />
        <View style={styles.mapOverlay} pointerEvents="box-none">
          <WorkerMapControls
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onLocate={handleLocate}
            locateEnabled={workerCoords != null}
          />
        </View>
      </View>
      <WorkerMapClinicSheet
        visible={selectedGroup != null}
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onSelectItem={handleSelectItem}
      />
    </View>
  );
}
