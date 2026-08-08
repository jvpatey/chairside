import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';
import { radii } from '@/theme/tokens';
import {
  webHover,
  webOnlyStyle,
  webPointer,
} from '@/lib/webPressableStyles';

type ProfileSettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  iconColor?: string;
  iconBackgroundColor?: string;
  /** When nested inside ProfileSettingsCard — no negative bleed margins. */
  embedded?: boolean;
};

export function ProfileSettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  iconColor,
  iconBackgroundColor,
  embedded = false,
}: ProfileSettingsRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: embedded ? 0 : spacing.sm,
      minHeight: subtitle ? 60 : 52,
      borderRadius: radii.sm,
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color',
        transitionDuration: '140ms',
      } as const),
    },
    rowHovered: {
      backgroundColor: colors.primarySubtle,
    },
    rowPressed: {
      backgroundColor: colors.fillSubtle,
      opacity: 0.95,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
    },
    textBlock: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    subtitle: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.row,
        webHover(hovered, pressed, styles.rowHovered),
        pressed && styles.rowPressed,
      ]}>
      <View
        style={[
          styles.iconWrap,
          iconBackgroundColor ? { backgroundColor: iconBackgroundColor } : null,
        ]}>
        <Ionicons name={icon} size={20} color={iconColor ?? colors.primary} />
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
    </Pressable>
  );
}
