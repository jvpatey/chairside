import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { webPointer } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

export type ClinicTypeChoice = 'individual' | 'group';

const OPTIONS: { value: ClinicTypeChoice; title: string; description: string }[] = [
  { value: 'individual', title: 'Single clinic', description: 'One location' },
  { value: 'group', title: 'Group of clinics', description: 'Two or more locations' },
];

type ClinicTypeToggleProps = {
  value: ClinicTypeChoice;
  onChange: (next: ClinicTypeChoice) => void;
  disabled?: boolean;
};

/** Two-option choice shown at clinic signup: single clinic (default) or a group. */
export function ClinicTypeToggle({ value, onChange, disabled = false }: ClinicTypeToggleProps) {
  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    row: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      gap: 2,
      minHeight: 44,
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 2,
      borderColor: colors.separator,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      ...webPointer(),
    },
    optionSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    optionDisabled: {
      opacity: 0.6,
    },
    title: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    description: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
  }));

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled }}
            accessibilityLabel={`${option.title}. ${option.description}`}
            disabled={disabled}
            onPress={() => {
              if (selected) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onChange(option.value);
            }}
            style={[
              styles.option,
              selected && styles.optionSelected,
              disabled && styles.optionDisabled,
            ]}>
            <Text style={styles.title}>{option.title}</Text>
            <Text style={styles.description}>{option.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
