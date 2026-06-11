import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, Text, View } from 'react-native';

import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';

export type DashboardQuickActionVariant = 'primary' | 'secondary';

type DashboardQuickActionTileProps = {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: DashboardQuickActionVariant;
  onPress: () => void;
};

export function DashboardQuickActionTile({
  label,
  description,
  icon,
  variant = 'primary',
  onPress,
}: DashboardQuickActionTileProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    tile: {
      flex: 1,
      borderRadius: 18,
      padding: spacing.md,
      gap: spacing.xs,
      minHeight: 108,
      borderWidth: 1,
      ...webPointer(),
    },
    tilePrimary: {
      borderColor: isDark ? `${colors.primary}55` : `${colors.primary}33`,
      backgroundColor: colors.primarySubtle,
    },
    tileSecondary: {
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    tileHovered: webTileHoverStyles(colors, isDark),
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.985 }],
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapPrimary: {
      backgroundColor: colors.primary,
    },
    iconWrapSecondary: {
      backgroundColor: colors.fillSubtle,
    },
    label: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 16,
      color: colors.labelPrimary,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isWeb = Platform.OS === 'web';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${description}`}
      accessibilityHint="Opens this section of the app"
      onPress={handlePress}
      style={({ pressed, hovered }) => [
        styles.tile,
        isPrimary ? styles.tilePrimary : styles.tileSecondary,
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <View style={[styles.iconWrap, isPrimary ? styles.iconWrapPrimary : styles.iconWrapSecondary]}>
        <Ionicons
          name={icon}
          size={22}
          color={isPrimary ? colors.primaryOnPrimary : colors.primary}
        />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}
