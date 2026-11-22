import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import {
  fontSemibold,
  useTheme,
  useThemedStyles,
  type GradientAccent,
} from '@/theme';

type CoverageFeedSectionProps = {
  title: string;
  count?: number;
  accent?: GradientAccent;
  icon?: keyof typeof Ionicons.glyphMap;
  viewAllLabel?: string;
  onViewAll?: () => void;
  children: ReactNode;
  /** Quieter section chrome for secondary feeds (roles). */
  quiet?: boolean;
};

/** Home feed section — title row + list, no nested file-tab well. */
export function CoverageFeedSection({
  title,
  count,
  accent = 'secondary',
  icon = 'time-outline',
  viewAllLabel = 'View all',
  onViewAll,
  children,
  quiet = false,
}: CoverageFeedSectionProps) {
  const { colors } = useTheme();
  const accentColor = resolveAccentColor(colors, accent);
  const accentSubtle = resolveAccentSubtle(colors, accent);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    root: {
      width: '100%' as const,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      minHeight: 36,
    },
    iconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: quiet ? colors.fillSubtle : accentSubtle,
    },
    title: {
      flex: 1,
      minWidth: 0,
      fontSize: quiet ? 16 : 18,
      lineHeight: quiet ? 22 : 24,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    countPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.pill,
      backgroundColor: quiet ? colors.fillSubtle : accentSubtle,
    },
    countText: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: quiet ? colors.labelSecondary : accentColor,
    },
    viewAll: {
      paddingVertical: 6,
      paddingHorizontal: 4,
      ...webPointer(),
    },
    viewAllLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: accentColor,
    },
    body: {
      gap: spacing.sm,
      width: '100%' as const,
    },
  }));

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Ionicons
            name={icon}
            size={16}
            color={quiet ? colors.labelSecondary : accentColor}
          />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {typeof count === 'number' && count > 0 ? (
          <View style={styles.countPill}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
        {onViewAll && (typeof count !== 'number' || count > 0) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={viewAllLabel}
            onPress={onViewAll}
            style={({ pressed, hovered }) => [
              styles.viewAll,
              webHover(hovered, pressed, webListRowHoverStyles(colors)),
              pressed && { opacity: 0.85 },
            ]}>
            <Text style={styles.viewAllLabel}>{viewAllLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}
