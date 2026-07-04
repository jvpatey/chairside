import { Pressable, ScrollView, Text, View } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { webChipHoverStyles, webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type ChipSelectorProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | T[] | null;
  multiple?: boolean;
  horizontal?: boolean;
  compact?: boolean;
  accent?: GradientAccent;
  disabled?: boolean;
  onChange: (value: T | T[]) => void;
};

export function ChipSelector<T extends string>({
  options,
  selected,
  multiple = false,
  horizontal = true,
  compact = false,
  accent,
  disabled = false,
  onChange,
}: ChipSelectorProps<T>) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = resolvedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: compact ? spacing.xs : spacing.sm,
    },
    horizontalContent: {
      flexDirection: 'row',
      gap: compact ? spacing.xs : spacing.sm,
      paddingRight: spacing.xs,
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: compact ? spacing.sm : spacing.md,
      paddingVertical: compact ? 4 : spacing.sm,
      ...webPointer(),
    },
    chipHovered: webChipHoverStyles(colors),
    chipPressed: {
      opacity: 0.88,
    },
    label: {
      ...typography.body,
      fontSize: compact ? 13 : 14,
      color: colors.labelPrimary,
    },
    disabled: {
      opacity: 0.42,
    },
  }));

  const chipSelectedStyle = {
    borderColor: brandColor,
    backgroundColor: brandSubtle,
  };
  const labelSelectedStyle = {
    fontWeight: '600' as const,
    color: brandColor,
  };

  const selectedItems: T[] = multiple
    ? Array.isArray(selected)
      ? selected
      : []
    : [];

  const isSelected = (value: T) =>
    multiple ? selectedItems.includes(value) : selected === value;

  const handlePress = (value: T) => {
    if (disabled) return;
    if (multiple) {
      if (selectedItems.includes(value)) {
        onChange(selectedItems.filter((item) => item !== value));
      } else {
        onChange([...selectedItems, value]);
      }
      return;
    }
    onChange(value);
  };

  const chips = options.map((option) => {
    const active = isSelected(option.value);
    return (
      <Pressable
        key={option.value}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled }}
        disabled={disabled}
        onPress={() => handlePress(option.value)}
        style={({ pressed, hovered }) => [
          styles.chip,
          active && chipSelectedStyle,
          !disabled && !active && webHover(hovered, pressed, styles.chipHovered),
          !disabled && pressed && styles.chipPressed,
        ]}
      >
        <Text style={[styles.label, active && labelSelectedStyle]}>{option.label}</Text>
      </Pressable>
    );
  });

  return horizontal ? (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.horizontalContent, disabled && styles.disabled]}
      scrollEnabled={!disabled}
    >
      {chips}
    </ScrollView>
  ) : (
    <View style={[styles.wrap, disabled && styles.disabled]}>{chips}</View>
  );
}
