import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ChipSelectorProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T | T[] | null;
  multiple?: boolean;
  onChange: (value: T | T[]) => void;
};

export function ChipSelector<T extends string>({
  options,
  selected,
  multiple = false,
  onChange,
}: ChipSelectorProps<T>) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    label: {
      ...typography.body,
      fontSize: 14,
      color: colors.labelPrimary,
    },
    labelSelected: {
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const isSelected = (value: T) =>
    multiple ? (selected as T[]).includes(value) : selected === value;

  const handlePress = (value: T) => {
    if (multiple) {
      const current = selected as T[];
      if (current.includes(value)) {
        onChange(current.filter((item) => item !== value));
      } else {
        onChange([...current, value]);
      }
      return;
    }
    onChange(value);
  };

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const active = isSelected(option.value);
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => handlePress(option.value)}
            style={[styles.chip, active && styles.chipSelected]}>
            <Text style={[styles.label, active && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
