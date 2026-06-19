import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import type { WorkerBrowseViewMode } from '@/lib/postingFilters';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerBrowseViewToggleProps = {
  selected: WorkerBrowseViewMode;
  onChange: (value: WorkerBrowseViewMode) => void;
};

export function WorkerBrowseViewToggle({ selected, onChange }: WorkerBrowseViewToggleProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const brandColor = tabAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = tabAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const isMap = selected === 'map';

  const styles = useThemedStyles(({ colors }) => ({
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      width: 44,
      height: 44,
      flexShrink: 0,
      ...webPointer(),
    },
    buttonHovered: {
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonActive: {
      borderColor: brandColor,
      backgroundColor: brandSubtle,
    },
    buttonActiveHovered: {
      backgroundColor: brandSubtle,
      borderColor: brandColor,
    },
  }));

  const handlePress = () => {
    void Haptics.selectionAsync();
    onChange(isMap ? 'list' : 'map');
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isMap ? 'Show list view' : 'Show map view'}
      accessibilityState={{ selected: isMap }}
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.button,
        isMap && styles.buttonActive,
        isWeb && hovered && !pressed && (isMap ? styles.buttonActiveHovered : styles.buttonHovered),
        isWeb && pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        name={isMap ? 'list-outline' : 'map-outline'}
        size={20}
        color={isMap ? brandColor : colors.labelPrimary}
      />
    </Pressable>
  );
}
