import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  getPrimaryTileGradient,
  getSecondaryTileGradient,
  fontBold,
  fontRegular,
  useTheme,
  useThemedStyles,
} from '@/theme';
import { webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';

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
  const { colors, isDark } = useTheme();
  const isPrimary = variant === 'primary';
  const gradientColors = isPrimary
    ? getPrimaryTileGradient(colors, isDark)
    : getSecondaryTileGradient(colors, isDark);

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    tile: {
      flex: 1,
      borderRadius: radii.xl,
      padding: spacing.md,
      gap: spacing.sm,
      minHeight: 116,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: isPrimary
        ? isDark
          ? `${colors.primary}66`
          : `${colors.primary}44`
        : isDark
          ? `${colors.separator}`
          : `${colors.separator}`,
      ...elevation(isPrimary ? 'raised' : 'subtle'),
      ...webPointer(),
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    decorIcon: {
      position: 'absolute',
      right: -6,
      bottom: -10,
      opacity: isPrimary ? 0.14 : 0.08,
    },
    content: {
      flex: 1,
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    tileHovered: webTileHoverStyles(colors, isDark),
    tilePressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapPrimary: {
      backgroundColor: colors.primary,
    },
    iconWrapSecondary: {
      backgroundColor: colors.secondarySubtle,
      borderWidth: 1,
      borderColor: isDark ? `${colors.secondary}55` : `${colors.secondary}33`,
    },
    label: {
      fontSize: 16,
      lineHeight: 22,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.2,
    },
    description: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontRegular,
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
        isWeb && hovered && !pressed && styles.tileHovered,
        pressed && styles.tilePressed,
      ]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <Ionicons
        name={icon}
        size={72}
        color={isPrimary ? colors.primary : colors.secondary}
        style={styles.decorIcon}
      />
      <View style={styles.content}>
        <View style={[styles.iconWrap, isPrimary ? styles.iconWrapPrimary : styles.iconWrapSecondary]}>
          <Ionicons
            name={icon}
            size={22}
            color={isPrimary ? colors.primaryOnPrimary : colors.secondary}
          />
        </View>
        <View>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </Pressable>
  );
}
