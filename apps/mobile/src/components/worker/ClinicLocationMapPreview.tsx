import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  getMapboxAccessToken,
  initializeMapbox,
  loadMapboxModule,
} from '@/lib/mapbox';
import { useTheme, useThemedStyles } from '@/theme';

const PREVIEW_HEIGHT = 168;
const PREVIEW_ZOOM = 14;

type ClinicLocationMapPreviewProps = {
  latitude: number;
  longitude: number;
};

export function ClinicLocationMapPreview({
  latitude,
  longitude,
}: ClinicLocationMapPreviewProps) {
  const { isDark } = useTheme();
  const maps = useMemo(() => loadMapboxModule(), []);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (maps) {
      setMapReady(initializeMapbox());
    }
  }, [maps]);

  const styles = useThemedStyles(({ colors }) => ({
    shell: {
      height: PREVIEW_HEIGHT,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.fillSubtle,
    },
    map: {
      ...StyleSheet.absoluteFillObject,
    },
    pinWrap: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    pin: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    fallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

  if (!getMapboxAccessToken() || !maps || !mapReady) {
    return <View style={styles.shell} />;
  }

  const Mapbox = maps.default;
  const { MapView, Camera, MarkerView } = maps;

  return (
    <View style={styles.shell}>
      <MapView
        style={styles.map}
        styleURL={isDark ? Mapbox.StyleURL.Dark : Mapbox.StyleURL.Street}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
        scaleBarEnabled={false}>
        <Camera
          centerCoordinate={[longitude, latitude]}
          zoomLevel={PREVIEW_ZOOM}
          animationDuration={0}
        />
        <MarkerView
          id="clinic-location"
          coordinate={[longitude, latitude]}
          anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pinWrap}>
            <View style={styles.pin} />
          </View>
        </MarkerView>
      </MapView>
    </View>
  );
}
