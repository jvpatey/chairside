import { type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { NotificationBell } from '@/components/notifications/NotificationBell';
import { TABLET_PROFILE_ROW_HEIGHT } from '@/lib/breakpoints';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { fontBold, fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { webTypography } from '@/theme/web';

export type PageHeaderVariant = 'hub' | 'detail' | 'tabletSection';

export type PageHeaderProps = {
  eyebrow?: string;
  title?: string | ReactNode;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  /** Actions beside the notification bell (edit, save, filters). */
  trailing?: ReactNode;
  showNotifications?: boolean;
  variant?: PageHeaderVariant;
  /** Smaller title — split-view detail panes. */
  compact?: boolean;
  accent?: GradientAccent;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared page chrome: back link, eyebrow, title, subtitle, trailing actions.
 * Used by Screen, FormScreen, and embedded master/detail panes.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  trailing,
  showNotifications = false,
  variant = 'hub',
  compact = false,
  accent = 'primary',
  style,
}: PageHeaderProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const isWeb = Platform.OS === 'web';
  const isTabletSection = variant === 'tabletSection';

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: isTabletSection ? 0 : spacing.sm,
      width: '100%',
    },
    wrapCompact: {
      gap: 0,
    },
    compactChromeRow: {
      alignItems: 'center' as const,
      minHeight: 44,
    },
    back: {
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
      marginLeft: -spacing.xs,
      marginBottom: isTabletSection ? 0 : spacing.xs,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backInline: {
      marginBottom: 0,
      minHeight: 40,
      flexShrink: 0,
    },
    backText: {
      fontSize: isWeb ? 15 : 16,
      fontWeight: '600',
      fontFamily: fontSemibold,
      color: brandColor,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: isTabletSection ? ('center' as const) : ('flex-start' as const),
      justifyContent: 'space-between',
      gap: spacing.sm,
      ...(isTabletSection ? { minHeight: TABLET_PROFILE_ROW_HEIGHT } : null),
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
      gap: isTabletSection ? 0 : spacing.xs,
    },
    eyebrow: isWeb
      ? { ...webTypography.eyebrow, color: colors.labelTertiary }
      : {
          fontSize: 13,
          fontWeight: '600',
          fontFamily: fontSemibold,
          letterSpacing: 0.4,
          textTransform: 'uppercase' as const,
          color: colors.labelTertiary,
        },
    titleHub: isWeb
      ? { ...webTypography.title, color: colors.labelPrimary }
      : typography.title,
    titleDetail: {
      ...(isWeb ? webTypography.title : typography.title),
      fontSize: compact ? 22 : isWeb ? 24 : 28,
      color: colors.labelPrimary,
    },
    titleTabletSection: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      fontFamily: fontBold,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: typography.subtitle.color,
    },
    subtitle: isWeb
      ? { ...webTypography.subtitle, fontSize: 15, color: colors.labelSecondary }
      : typography.subtitle,
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
    compactTitle: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
  }));

  const titleStyle =
    variant === 'tabletSection'
      ? styles.titleTabletSection
      : variant === 'detail'
        ? styles.titleDetail
        : styles.titleHub;

  const showTrailing = Boolean(trailing) || showNotifications;
  const showTitleBlock = Boolean(eyebrow || title || subtitle);
  const compactChrome = Boolean(onBack) && !showTitleBlock;

  const backControl = onBack ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={backLabel}
      onPress={onBack}
      style={({ pressed, hovered }) => [
        styles.back,
        compactChrome && styles.backInline,
        webHover(hovered, pressed, styles.backHovered),
        pressed && { opacity: 0.75 },
      ]}
    >
      <Text style={styles.backText}>{backLabel}</Text>
    </Pressable>
  ) : null;

  const trailingBlock = showTrailing ? (
    <View style={styles.trailing}>
      {trailing}
      {showNotifications ? (
        <NotificationBell placement={isTabletSection ? 'hero' : 'header'} />
      ) : null}
    </View>
  ) : null;

  if (compactChrome) {
    return (
      <View style={[styles.wrap, styles.wrapCompact, style]}>
        <View style={[styles.topRow, styles.compactChromeRow]}>
          {backControl}
          {trailingBlock}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      {backControl}
      {showTitleBlock || showTrailing ? (
        <View style={styles.topRow}>
          {showTitleBlock ? (
            <View style={styles.textBlock}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              {title != null ? (
                // Inline nodes (e.g. the brand wordmark) stay inside the title
                // Text so they inherit its typography instead of rendering as
                // unstyled block text.
                <Text style={titleStyle} numberOfLines={variant === 'tabletSection' ? 1 : undefined}>
                  {title}
                </Text>
              ) : null}
              {subtitle && variant !== 'tabletSection' ? (
                <Text style={styles.subtitle}>{subtitle}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.textBlock} />
          )}
          {trailingBlock}
        </View>
      ) : null}
    </View>
  );
}

/** Compact single-line title for native scroll-collapse overlay. */
export function PageHeaderCompactBar({
  title,
  showNotifications = false,
  trailing,
}: {
  title: string;
  showNotifications?: boolean;
  trailing?: ReactNode;
}) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600',
    },
    trailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
    },
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {(trailing || showNotifications) && (
        <View style={styles.trailing}>
          {trailing}
          {showNotifications ? <NotificationBell /> : null}
        </View>
      )}
    </View>
  );
}
