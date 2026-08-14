import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { WorkerMapClinicSheet } from '@/components/worker/WorkerMapClinicSheet';
import { WorkerMapNotices } from '@/components/worker/WorkerMapNotices';
import { WorkerMapPin, WorkerMapWorkerPin } from '@/components/worker/WorkerMapPin';
import { WorkerMapUnavailable } from '@/components/worker/WorkerMapUnavailable';
import { WorkerMapControls } from '@/components/worker/WorkerMapControls';
import type { WorkerBrowseMapProps } from '@/components/worker/workerBrowseMapTypes';
import {
  getMapboxAccessToken,
  initializeMapbox,
  loadMapboxModule,
  type MapboxRuntimeModule,
} from '@/lib/mapbox';
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
const ZOOM_SCALE_FACTOR = 1.4;
const LOCATE_ANIMATION_MS = 350;

type MapCameraHandle = {
  scaleBy: (props: {
    x: number;
    y: number;
    scaleFactor: number;
    animationDuration?: number;
  }) => void;
  setCamera: (config: {
    centerCoordinate?: [number, number];
    zoomLevel?: number;
    animationDuration?: number;
  }) => void;
};

function formatPinCount(group: WorkerMapClinicGroup): string {
  const total = group.items.length;
  return total > 9 ? '9+' : String(total);
}

function getUnavailableMessage(maps: MapboxRuntimeModule | null) {
  if (!getMapboxAccessToken()) {
    return {
      title: 'Map unavailable',
      body: 'Add a Mapbox access token to enable the map view. List view still works.',
    };
  }

  if (!maps) {
    return {
      title: 'Map requires a development build',
      body: 'The map uses native Mapbox code and is not available in Expo Go. Use list view, or run a custom dev build with `npx expo run:ios` or `npx expo run:android`.',
    };
  }

  return {
    title: 'Map unavailable',
    body: 'Could not initialize the map. List view still works.',
  };
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
  const maps = useMemo(() => loadMapboxModule(), []);
  const [mapReady, setMapReady] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<WorkerMapClinicGroup | null>(null);
  const cameraRef = useRef<MapCameraHandle | null>(null);
  const mapSizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (maps) {
      setMapReady(initializeMapbox());
    }
  }, [maps]);

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

  const styles = useThemedStyles(({ colors }) => ({
    root: {
      flex: 1,
      minHeight: 0,
      width: '100%',
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
    map: {
      ...StyleSheet.absoluteFillObject,
    },
  }));

  const handleMapShellLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    mapSizeRef.current = { width, height };
  };

  const scaleMap = useCallback((scaleFactor: number) => {
    const { width, height } = mapSizeRef.current;
    if (width <= 0 || height <= 0) return;
    cameraRef.current?.scaleBy({
      x: width / 2,
      y: height / 2,
      scaleFactor,
      animationDuration: ZOOM_ANIMATION_MS,
    });
  }, []);

  const handleZoomIn = useCallback(() => {
    scaleMap(ZOOM_SCALE_FACTOR);
  }, [scaleMap]);

  const handleZoomOut = useCallback(() => {
    scaleMap(1 / ZOOM_SCALE_FACTOR);
  }, [scaleMap]);

  const handleLocate = useCallback(() => {
    if (!workerCoords) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [workerCoords.longitude, workerCoords.latitude],
      zoomLevel: getWorkerLocateZoom(),
      animationDuration: LOCATE_ANIMATION_MS,
    });
  }, [workerCoords]);

  if (!maps || !mapReady) {
    const unavailable = getUnavailableMessage(maps);
    return (
      <View style={styles.root}>
        <WorkerMapUnavailable title={unavailable.title} body={unavailable.body} />
      </View>
    );
  }

  const Mapbox = maps.default;
  const MapView = maps.MapView;
  const Camera = maps.Camera;
  const MarkerView = maps.MarkerView;

  const handleSelectItem = (item: WorkerMapItem) => {
    setSelectedGroup(null);
    onSelectItem(item);
  };

  return (
    <View style={styles.root}>
      <WorkerMapNotices
        unmappableCount={unmappableCount}
        workerHasCoordinates={workerHasCoordinates}
      />
      <View style={styles.mapShell} collapsable={false} onLayout={handleMapShellLayout}>
        <MapView
          style={styles.map}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
          compassEnabled
          logoEnabled={false}
          attributionEnabled
          attributionPosition={{ bottom: 8, left: 8 }}
          scaleBarEnabled={false}
        >
          {mapBounds ? (
            <Camera
              ref={cameraRef}
              bounds={{
                ne: [mapBounds.ne.longitude, mapBounds.ne.latitude],
                sw: [mapBounds.sw.longitude, mapBounds.sw.latitude],
              }}
              padding={{
                paddingTop: 48,
                paddingBottom: 48,
                paddingLeft: 48,
                paddingRight: 48,
              }}
              animationDuration={0}
            />
          ) : (
            <Camera
              ref={cameraRef}
              centerCoordinate={[mapCenter.longitude, mapCenter.latitude]}
              zoomLevel={getDefaultMapZoom()}
              animationDuration={0}
            />
          )}
          {workerCoords ? (
            <MarkerView
              id="worker-location"
              coordinate={[workerCoords.longitude, workerCoords.latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <WorkerMapWorkerPin />
            </MarkerView>
          ) : null}
          {groups.map((group) => (
            <MarkerView
              key={group.clinicId}
              id={group.clinicId}
              coordinate={[group.longitude, group.latitude]}
              anchor={{ x: 0.5, y: 0.5 }}
              allowOverlap
            >
              <WorkerMapPin
                label={formatPinCount(group)}
                saved={group.hasSaved}
                onPress={() => setSelectedGroup(group)}
              />
            </MarkerView>
          ))}
        </MapView>
        <WorkerMapControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onLocate={handleLocate}
          locateEnabled={workerCoords != null}
        />
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
