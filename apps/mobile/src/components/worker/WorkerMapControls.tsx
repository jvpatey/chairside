import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';

import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerMapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  locateEnabled: boolean;
};

export function WorkerMapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  locateEnabled,
}: WorkerMapControlsProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    container: {
      position: 'absolute',
      right: spacing.md,
      bottom: spacing.md,
      zIndex: 2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      ...webPointer(),
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 40,
      height: 40,
      ...webPointer(),
    },
    buttonDisabled: {
      opacity: 0.35,
    },
    buttonHovered: {
      backgroundColor: colors.backgroundGrouped,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    divider: {
      height: 1,
      backgroundColor: colors.separator,
    },
  }));

  const isWeb = Platform.OS === 'web';

  const handleZoomIn = () => {
    void Haptics.selectionAsync();
    onZoomIn();
  };

  const handleZoomOut = () => {
    void Haptics.selectionAsync();
    onZoomOut();
  };

  const handleLocate = () => {
    if (!locateEnabled) return;
    void Haptics.selectionAsync();
    onLocate();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go to my location"
        accessibilityState={{ disabled: !locateEnabled }}
        disabled={!locateEnabled}
        onPress={handleLocate}
        style={({ pressed, hovered }) => [
          styles.button,
          !locateEnabled && styles.buttonDisabled,
          locateEnabled && isWeb && hovered && !pressed && styles.buttonHovered,
          locateEnabled && pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons
          name="navigate"
          size={18}
          color={locateEnabled ? colors.primary : colors.labelTertiary}
        />
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        onPress={handleZoomIn}
        style={({ pressed, hovered }) => [
          styles.button,
          isWeb && hovered && !pressed && styles.buttonHovered,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="add" size={20} color={colors.labelPrimary} />
      </Pressable>
      <View style={styles.divider} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        onPress={handleZoomOut}
        style={({ pressed, hovered }) => [
          styles.button,
          isWeb && hovered && !pressed && styles.buttonHovered,
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="remove" size={20} color={colors.labelPrimary} />
      </Pressable>
    </View>
  );
}
