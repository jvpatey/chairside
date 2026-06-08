import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import {
  webFullBleedRowInsets,
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type SettingsRadioRowProps = {
  label: string;
  hint?: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  bleedPadding?: number;
};

export function SettingsRadioRow({
  label,
  hint,
  selected,
  disabled = false,
  onPress,
  bleedPadding,
}: SettingsRadioRowProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 44,
      borderRadius: 10,
      ...(bleedPadding != null ? webFullBleedRowInsets(bleedPadding) : null),
      ...webPointer(disabled ? 'default' : 'pointer'),
    },
    rowHovered: webListRowHoverStyles(colors),
    rowPressed: {
      opacity: 0.88,
    },
    text: { flex: 1, gap: 2 },
    label: { fontSize: 15, fontWeight: '500', lineHeight: 20 },
    labelSelected: { fontWeight: '600', color: colors.labelPrimary },
    labelUnselected: { color: colors.labelSecondary },
    hint: { fontSize: 13, lineHeight: 18, color: colors.labelTertiary },
  }));

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered, disabled),
        pressed && !disabled && styles.rowPressed,
      ]}>
      <Ionicons
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={20}
        color={selected ? colors.primary : colors.labelTertiary}
      />
      <View style={styles.text}>
        <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
          {label}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}
