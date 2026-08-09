import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import { fontRegular, fontSemibold, colorWithAlpha, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  accent?: GradientAccent;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaAccent?: GradientAccent;
  /** Drop card chrome when nested inside a parent panel. */
  embedded?: boolean;
  /** Grow to fill the parent and vertically center content (desktop columns). */
  fill?: boolean;
};

/** Branded empty state card used across lists, inboxes, and dashboard panels. */
export function EmptyState({
  icon,
  title,
  message,
  accent,
  ctaLabel,
  onCtaPress,
  ctaAccent,
  embedded = false,
  fill = false,
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolveAccentColor(colors, resolvedAccent);
  const brandSubtle = resolveAccentSubtle(colors, resolvedAccent);

  const styles = useThemedStyles(({ colors, spacing, radii, elevation }) => ({
    card: {
      backgroundColor: embedded ? 'transparent' : colors.surface,
      borderRadius: embedded ? 0 : radii.lg,
      borderWidth: embedded ? 0 : StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      padding: embedded ? spacing.md : spacing.xl,
      alignItems: 'center',
      justifyContent: fill ? ('center' as const) : undefined,
      gap: spacing.md,
      width: '100%',
      alignSelf: 'stretch' as const,
      ...(fill ? { flex: 1, minHeight: 220 } : null),
      ...(embedded ? null : elevation('subtle')),
    },
    motif: {
      width: 72,
      height: 72,
      borderRadius: radii.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 17,
      lineHeight: 22,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    cta: {
      alignSelf: 'stretch',
      marginTop: spacing.xs,
    },
  }));

  const motifAccentStyle = {
    backgroundColor: brandSubtle,
    borderWidth: 1,
    borderColor: colorWithAlpha(brandColor, isDark ? 0.333 : 0.2),
  };

  return (
    <View style={styles.card}>
      <View style={[styles.motif, motifAccentStyle]}>
        <Ionicons name={icon} size={32} color={brandColor} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {ctaLabel && onCtaPress ? (
        <OnboardingButton
          label={ctaLabel}
          onPress={onCtaPress}
          accent={ctaAccent ?? resolvedAccent}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}
