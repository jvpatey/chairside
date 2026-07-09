import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import type { WorkerBrowseViewMode } from '@/lib/postingFilters';
import { webPointer } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type WorkerBrowseViewToggleProps = {
  selected: WorkerBrowseViewMode;
  onChange: (value: WorkerBrowseViewMode) => void;
};

const VIEW_OPTIONS = [
  { value: 'list' as const, icon: 'list-outline' as const, label: 'List view' },
  { value: 'map' as const, icon: 'map-outline' as const, label: 'Map view' },
];

export function WorkerBrowseViewToggle({ selected, onChange }: WorkerBrowseViewToggleProps) {
  const { colors, isDark } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const brandColor = tabAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = tabAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    group: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      padding: 3,
      gap: 3,
      flexShrink: 0,
    },
    segment: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radii.sm + 2,
      ...webPointer(),
    },
    segmentHovered: {
      backgroundColor: colors.backgroundGrouped,
    },
    segmentPressed: {
      opacity: 0.85,
    },
    segmentSelected: {
      backgroundColor: brandSubtle,
      borderWidth: 1,
      borderColor: colorWithAlpha(brandColor, isDark ? 0.45 : 0.35),
    },
    segmentSelectedHovered: {
      backgroundColor: brandSubtle,
    },
  }));

  const handleSelect = (value: WorkerBrowseViewMode) => {
    if (value === selected) return;
    void Haptics.selectionAsync();
    onChange(value);
  };

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel="Browse view"
      style={styles.group}>
      {VIEW_OPTIONS.map((option) => {
        const isSelected = selected === option.value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
            onPress={() => handleSelect(option.value)}
            style={({ pressed, hovered }) => [
              styles.segment,
              isSelected && styles.segmentSelected,
              isWeb && hovered && !pressed && (isSelected ? styles.segmentSelectedHovered : styles.segmentHovered),
              pressed && styles.segmentPressed,
            ]}>
            <Ionicons
              name={option.icon}
              size={20}
              color={isSelected ? brandColor : colors.labelSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
