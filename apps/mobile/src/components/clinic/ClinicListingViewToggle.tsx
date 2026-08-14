import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, View } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import type { ClinicListingViewMode } from '@/lib/clinicListingViewStorage';
import { webPointer } from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type ClinicListingViewToggleProps = {
  selected: ClinicListingViewMode;
  onChange: (value: ClinicListingViewMode) => void;
  accent?: GradientAccent;
};

const VIEW_OPTIONS = [
  { value: 'cards' as const, icon: 'grid-outline' as const, label: 'Card view' },
  { value: 'list' as const, icon: 'list-outline' as const, label: 'List view' },
];

export function ClinicListingViewToggle({
  selected,
  onChange,
  accent,
}: ClinicListingViewToggleProps) {
  const { colors, isDark } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? (tabAccent === 'secondary' ? 'secondary' : 'primary');
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle =
    resolvedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, radii }) => ({
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

  const handleSelect = (value: ClinicListingViewMode) => {
    if (value === selected) return;
    void Haptics.selectionAsync();
    onChange(value);
  };

  return (
    <View accessibilityRole="tablist" accessibilityLabel="Listing view" style={styles.group}>
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
              isWeb &&
                hovered &&
                !pressed &&
                (isSelected ? styles.segmentSelectedHovered : styles.segmentHovered),
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
