import { Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  selected: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  selected,
  onChange,
}: SegmentedControlProps<T>) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.fillSubtle,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    segmentSelected: {
      backgroundColor: colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    },
    label: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
    labelSelected: {
      fontWeight: '600',
      color: colors.labelPrimary,
    },
  }));

  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
