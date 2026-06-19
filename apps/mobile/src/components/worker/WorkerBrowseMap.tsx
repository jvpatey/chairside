import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { WorkerMapClinicSheet } from '@/components/worker/WorkerMapClinicSheet';
import { WorkerMapPin, WorkerMapWorkerPin } from '@/components/worker/WorkerMapPin';
import { WorkerMapUnavailable } from '@/components/worker/WorkerMapUnavailable';
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
  getWorkerMapCenter,
} from '@/lib/workerMapRegion';
import { useTheme, useThemedStyles } from '@/theme';

export type { WorkerBrowseMapProps } from '@/components/worker/workerBrowseMapTypes';

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

  if (!maps || !mapReady) {
    const unavailable = getUnavailableMessage(maps);
    return (
      <View style={styles.root}>
        <WorkerMapUnavailable title={unavailable.title} body={unavailable.body} />
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

  const Mapbox = maps.default;
  const MapView = maps.MapView;
  const Camera = maps.Camera;
  const MarkerView = maps.MarkerView;

  const handleSelectItem = (item: WorkerMapItem) => {
    setSelectedGroup(null);
    onSelectItem(item);
  };

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
        <MapView
          style={styles.map}
          styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
          compassEnabled
          logoEnabled={false}
          attributionEnabled
          scaleBarEnabled={false}
        >
          {mapBounds ? (
            <Camera
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
