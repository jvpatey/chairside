import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useWebCardLift, webCardLiftBase, webOnlyStyle } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';
import { getWebShadow, webSectionEyebrowStyle, webTypography } from '@/theme/web';

/**
 * Shared welcome/pricing card grammar:
 * white surface card (radius 20) containing a tinted snapshot inset (radius 14).
 */
export function WebMarketingCard({
  children,
  style,
  lift = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Hover lift on web pointers. */
  lift?: boolean;
}) {
  const { isDark } = useTheme();
  const { liftStyle, hoverHandlers } = useWebCardLift(isDark);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      flex: 1,
      borderRadius: 20,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.md,
      ...webCardLiftBase(),
      ...webOnlyStyle({ boxShadow: getWebShadow(isDark, 'subtle') } as object),
    },
  }));

  return (
    <View style={[styles.card, lift && liftStyle, style]} {...(lift ? hoverHandlers : {})}>
      {children}
    </View>
  );
}

export function WebMarketingSnapshotShell({
  accent: _accent = 'primary',
  children,
  style,
}: {
  /** Kept for call-site compatibility — accent lives on buttons/chips, not the wash. */
  accent?: GradientAccent;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(({ colors }) => ({
    shell: {
      borderRadius: 14,
      overflow: 'hidden' as const,
      padding: 12,
      gap: 10,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.separator,
      // Match in-app nested canvases — not marketing color washes.
      backgroundColor: colors.backgroundGrouped,
    },
  }));

  void _accent;
  return <View style={[styles.shell, style]}>{children}</View>;
}

/** Standard card title: 18/24 bold with a single accent word. */
export function WebMarketingCardTitle({
  title,
  highlight,
  accent = 'primary',
  style,
}: {
  title: string;
  highlight?: string;
  accent?: GradientAccent;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const accentColor =
    accent === 'secondary'
      ? colors.secondary
      : accent === 'tertiary'
        ? colors.tertiary
        : colors.primary;
  const base: TextStyle = {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.labelPrimary,
  };

  if (!highlight || !title.includes(highlight)) {
    return <Text style={[base, style]}>{title}</Text>;
  }

  const [before, after] = title.split(highlight);
  return (
    <Text style={[base, style]}>
      {before}
      <Text style={{ color: accentColor }}>{highlight}</Text>
      {after}
    </Text>
  );
}

/** Standard section header: eyebrow + 32px headline + one-line 17px subtitle. */
export function WebMarketingSectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  style,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    header: {
      gap: spacing.sm,
      marginBottom: spacing.xl,
      maxWidth: 560,
      ...(align === 'center'
        ? { alignItems: 'center' as const, alignSelf: 'center' as const }
        : {}),
    },
    eyebrow: {
      ...webSectionEyebrowStyle(colors),
      ...(align === 'center' ? { textAlign: 'center' as const } : {}),
    },
    title: {
      ...webTypography.headline,
      color: colors.labelPrimary,
      ...(align === 'center' ? { textAlign: 'center' as const } : {}),
    },
    subtitle: {
      ...webTypography.subtitle,
      fontSize: 17,
      lineHeight: 26,
      color: colors.labelSecondary,
      ...(align === 'center' ? { textAlign: 'center' as const } : {}),
    },
  }));

  return (
    <View style={[styles.header, style]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
