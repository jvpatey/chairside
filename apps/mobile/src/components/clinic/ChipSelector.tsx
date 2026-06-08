import { Pressable, ScrollView, Text, View } from 'react-native';

import { webChipHoverStyles, webHover, webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type ChipSelectorProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | T[] | null;
  multiple?: boolean;
  horizontal?: boolean;
  compact?: boolean;
  onChange: (value: T | T[]) => void;
};

export function ChipSelector<T extends string>({
  options,
  selected,
  multiple = false,
  horizontal = true,
  compact = false,
  onChange,
}: ChipSelectorProps<T>) {
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
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.body,
      fontSize: compact ? 13 : 14,
      color: colors.labelPrimary,
    },
    labelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const selectedItems: T[] = multiple
    ? Array.isArray(selected)
      ? selected
      : []
    : [];

  const isSelected = (value: T) =>
    multiple ? selectedItems.includes(value) : selected === value;

  const handlePress = (value: T) => {
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
        accessibilityState={{ selected: active }}
        onPress={() => handlePress(option.value)}
        style={({ pressed, hovered }) => [
          styles.chip,
          active && styles.chipSelected,
          !active && webHover(hovered, pressed, styles.chipHovered),
          pressed && styles.chipPressed,
        ]}
      >
        <Text style={[styles.label, active && styles.labelSelected]}>{option.label}</Text>
      </Pressable>
    );
  });

  return horizontal ? (
    <ScrollView
      horizontal
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.horizontalContent}
    >
      {chips}
    </ScrollView>
  ) : (
    <View style={styles.wrap}>{chips}</View>
  );
}
