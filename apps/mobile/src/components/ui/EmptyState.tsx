import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { fontRegular, fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type EmptyStateProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  accent?: GradientAccent;
  ctaLabel?: string;
  onCtaPress?: () => void;
  ctaAccent?: GradientAccent;
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
}: EmptyStateProps) {
  const { colors, isDark } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = resolvedAccent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: isDark ? 1 : 0,
      borderColor: colors.separator,
      padding: spacing.xl,
      alignItems: 'center',
      gap: spacing.md,
      width: '100%',
      alignSelf: 'stretch' as const,
      ...elevation('subtle'),
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
    borderColor: isDark ? `${brandColor}55` : `${brandColor}33`,
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
