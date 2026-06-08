import { Pressable, Text, View } from 'react-native';

import { ThemedSwitch } from '@/components/ui/ThemedSwitch';
import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type SettingsToggleRowProps = {
  title: string;
  hint: string;
  value: boolean;
  disabled?: boolean;
  prominence?: 'primary' | 'secondary';
  onValueChange: (value: boolean) => void;
  /** Horizontal padding of parent card — enables full-width hover bleed. */
  bleedPadding?: number;
};

export function SettingsToggleRow({
  title,
  hint,
  value,
  disabled = false,
  prominence = 'secondary',
  onValueChange,
  bleedPadding,
}: SettingsToggleRowProps) {
  const { colors } = useTheme();
  const isPrimary = prominence === 'primary';

  const styles = useThemedStyles(({ spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      minHeight: isPrimary ? 56 : 52,
      paddingVertical: isPrimary ? spacing.sm + 2 : spacing.sm,
      borderRadius: 10,
      ...(bleedPadding != null ? webFullBleedRowInsets(bleedPadding) : null),
      ...webPointer(disabled ? 'default' : 'pointer'),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.88,
    },
    rowText: { flex: 1, gap: spacing.xs },
    titlePrimary: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '700',
      lineHeight: 22,
    },
    titleSecondary: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 21,
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    switchWrap: {
      paddingRight: isPrimary ? spacing.xs : 0,
    },
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered, disabled),
        pressed && !disabled && styles.rowPressed,
      ]}>
      <View style={styles.rowText}>
        <Text style={isPrimary ? styles.titlePrimary : styles.titleSecondary}>{title}</Text>
        <Text style={styles.hint}>{hint}</Text>
      </View>
      <View style={styles.switchWrap}>
        <ThemedSwitch
          value={value}
          disabled={disabled}
          onValueChange={onValueChange}
        />
      </View>
    </Pressable>
  );
}
