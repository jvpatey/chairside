import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';

import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { webChipHoverStyles, webHover, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type EditPillButtonProps = {
  label: string;
  onPress: () => void;
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accent?: GradientAccent;
};

export function EditPillButton({
  label,
  onPress,
  showIcon = true,
  style,
  accessibilityLabel,
  accent,
}: EditPillButtonProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = resolvedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
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
      backgroundColor: brandSubtle,
      borderColor: brandColor,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: brandColor,
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
      {showIcon ? <Ionicons name="create-outline" size={15} color={brandColor} /> : null}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
