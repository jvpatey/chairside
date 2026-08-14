import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { resolveAccentColor, resolveAccentOnColor } from '@/lib/accentColors';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type SelectionCheckboxProps = {
  selected: boolean;
  accent?: GradientAccent;
  accessibilityLabel?: string;
};

/** Compact filled-square checkbox for multi-select lists. */
export function SelectionCheckbox({
  selected,
  accent = 'primary',
  accessibilityLabel,
}: SelectionCheckboxProps) {
  const { colors } = useTheme();
  const accentColor = resolveAccentColor(colors, accent);
  const onAccent = resolveAccentOnColor(colors, accent);

  const styles = useThemedStyles(({ colors }) => ({
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.separator,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 2,
    },
    checkboxSelected: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
  }));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected ? <Ionicons name="checkmark" size={14} color={onAccent} /> : null}
    </View>
  );
}
