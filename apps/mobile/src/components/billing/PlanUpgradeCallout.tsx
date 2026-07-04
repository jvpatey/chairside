import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { openClinicBillingScreen } from '@/components/billing/ClinicBillingScreenContent';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type PlanUpgradeCalloutProps = {
  title: string;
  message: string;
  /** Defaults to the clinic billing screen — the callout already explains the upgrade. */
  onUpgrade?: () => void;
  accent?: GradientAccent;
  buttonLabel?: string;
  /** Inline variant for helper text areas (no full-width button). */
  compact?: boolean;
};

export function PlanUpgradeCallout({
  title,
  message,
  onUpgrade = openClinicBillingScreen,
  accent = 'primary',
  buttonLabel = 'View plans',
  compact = false,
}: PlanUpgradeCalloutProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${brandColor}44`,
      backgroundColor: brandSubtle,
      padding: compact ? spacing.md : spacing.lg,
      gap: compact ? spacing.sm : spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: compact ? 36 : 40,
      height: compact ? 36 : 40,
      borderRadius: compact ? 18 : 20,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: `${brandColor}33`,
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      gap: spacing.xs,
      minWidth: 0,
    },
    title: {
      ...typography.body,
      fontSize: compact ? 15 : 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    message: {
      ...typography.subtitle,
      fontSize: compact ? 14 : 15,
      lineHeight: compact ? 20 : 22,
      color: colors.labelSecondary,
    },
    link: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    linkText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: brandColor,
    },
  }));

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons
            name="sparkles-outline"
            size={compact ? 18 : 20}
            color={brandColor}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      {compact ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={buttonLabel}
          onPress={onUpgrade}
          style={styles.link}
        >
          <Text style={styles.linkText}>{buttonLabel}</Text>
        </Pressable>
      ) : (
        <OnboardingButton
          label={buttonLabel}
          variant="secondary"
          onPress={onUpgrade}
        />
      )}
    </View>
  );
}
