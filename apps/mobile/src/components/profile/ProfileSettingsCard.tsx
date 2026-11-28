import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  DashboardWidgetIconBadge,
  type DashboardWidgetAccent,
} from '@/components/dashboard/DashboardWidgetIconBadge';
import { webHover, webListRowHoverStyles, webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { getElevationStyle } from '@/theme/tokens';

export type ProfileSettingsCardVariant = 'default' | 'danger';

export type ProfileSettingsCardProps = {
  title: string;
  subtitle?: string;
  /** Only shown on collapsible / danger cards. Default cards use the uppercase eyebrow title. */
  icon?: keyof typeof Ionicons.glyphMap;
  iconAccent?: DashboardWidgetAccent;
  /** Custom leading content (e.g. avatar). Takes precedence over `icon`. */
  leading?: ReactNode;
  children: ReactNode;
  variant?: ProfileSettingsCardVariant;
  style?: StyleProp<ViewStyle>;
  headerAccessory?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /** Max lines for the subtitle (default 1). */
  subtitleNumberOfLines?: number;
};

export function ProfileSettingsCard({
  title,
  subtitle,
  icon,
  iconAccent = 'primary',
  leading,
  children,
  variant = 'default',
  style,
  headerAccessory,
  collapsible = false,
  defaultExpanded = true,
  subtitleNumberOfLines = 1,
}: ProfileSettingsCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isDanger = variant === 'danger';
  const iconColor = isDanger ? colors.destructive : colors.primary;

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDanger ? `${colors.destructive}33` : colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
      ...getElevationStyle({ isDark, level: 'subtle' }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
      borderRadius: 10,
      marginHorizontal: -spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    headerHovered: webListRowHoverStyles(colors),
    headerPressed: {
      opacity: 0.88,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDanger ? `${colors.destructive}14` : colors.fillSubtle,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '600',
      color: isDanger ? colors.destructive : colors.labelPrimary,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    accessory: {
      flexShrink: 0,
    },
    eyebrowRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
      paddingHorizontal: spacing.xs,
      marginBottom: spacing.sm,
    },
    eyebrowPressable: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      minWidth: 0,
      borderRadius: 8,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    eyebrow: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: isDanger ? colors.destructive : colors.labelSecondary,
    },
  }));

  const toggleExpanded = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded((current) => !current);
  };

  const headerIcon = leading ? (
    leading
  ) : icon ? (
    isDanger ? (
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
    ) : (
      <DashboardWidgetIconBadge icon={icon} accent={iconAccent} />
    )
  ) : null;

  const headerText = (
    <View style={styles.headerText}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={subtitleNumberOfLines}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );

  const header = collapsible ? (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        style={({ pressed, hovered }) => [
          styles.headerMain,
          webHover(hovered, pressed, styles.headerHovered),
          pressed && styles.headerPressed,
        ]}>
        {headerIcon}
        {headerText}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>
      {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
    </View>
  ) : (
    <View style={styles.header}>
      {headerIcon}
      {headerText}
      {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
    </View>
  );

  // Collapsible eyebrow: the title row is the tap target; the card body only shows when expanded.
  if (collapsible && !leading) {
    return (
      <View style={style}>
        <View style={styles.eyebrowRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${title}`}
            accessibilityState={{ expanded }}
            onPress={toggleExpanded}
            style={({ pressed, hovered }) => [
              styles.eyebrowPressable,
              webHover(hovered, pressed, styles.headerHovered),
              pressed && styles.headerPressed,
            ]}>
            <Text style={styles.eyebrow} numberOfLines={1}>
              {title}
            </Text>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.labelTertiary}
            />
          </Pressable>
          {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
        </View>
        {expanded ? (
          <View style={styles.card}>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={subtitleNumberOfLines}>
                {subtitle}
              </Text>
            ) : null}
            {children}
          </View>
        ) : null}
      </View>
    );
  }

  // Default cards: section name as a small uppercase eyebrow above the card, body inside.
  // Custom-leading cards keep the in-card header.
  if (!collapsible && !leading) {
    return (
      <View style={style}>
        <View style={styles.eyebrowRow}>
          <Text style={styles.eyebrow} numberOfLines={1}>
            {title}
          </Text>
          {headerAccessory ? <View style={styles.accessory}>{headerAccessory}</View> : null}
        </View>
        <View style={styles.card}>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={subtitleNumberOfLines}>
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {header}
      {!collapsible || expanded ? children : null}
    </View>
  );
}
