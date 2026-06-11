import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { webChipHoverStyles, webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

type EditPillButtonProps = {
  label: string;
  onPress: () => void;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function EditPillButton({
  label,
  onPress,
  showIcon = true,
  style,
  accessibilityLabel,
}: EditPillButtonProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      minHeight: 36,
      alignSelf: 'flex-start',
      ...webPointer(),
    },
    pressed: {
      backgroundColor: colors.backgroundGrouped,
      borderColor: colors.labelTertiary,
    },
    hovered: {
      ...webChipHoverStyles(colors),
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: 0.1,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.button,
        style,
        webHover(hovered, pressed, styles.hovered),
        pressed && styles.pressed,
      ]}>
      {showIcon ? <Ionicons name="create-outline" size={15} color={colors.primary} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
