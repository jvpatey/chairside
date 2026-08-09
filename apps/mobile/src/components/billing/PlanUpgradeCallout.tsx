import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { openClinicBillingModal } from '@/components/billing/ClinicBillingModal';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { webPointer } from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type PlanUpgradeCalloutVariant = 'notice' | 'emphasis';

type PlanUpgradeCalloutProps = {
  title: string;
  message: string;
  /** Defaults to opening Plans & billing. */
  onUpgrade?: () => void;
  accent?: GradientAccent;
  buttonLabel?: string;
  /** Quiet inline strip (default). Use `emphasis` for a stronger full-width CTA. */
  variant?: PlanUpgradeCalloutVariant;
  /** @deprecated Prefer `variant="notice"`. Kept for back-compat; maps to notice. */
  compact?: boolean;
};

export function PlanUpgradeCallout({
  title,
  message,
  onUpgrade = openClinicBillingModal,
  accent = 'primary',
  buttonLabel = 'View plans',
  variant,
  compact = false,
}: PlanUpgradeCalloutProps) {
  const { colors } = useTheme();
  const resolvedVariant: PlanUpgradeCalloutVariant = variant ?? 'notice';
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle = accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;

  const noticeStyles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    strip: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radii.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
    },
    icon: {
      marginTop: 1,
      flexShrink: 0,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    messageRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      columnGap: spacing.xs,
      rowGap: 2,
    },
    message: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      flexShrink: 1,
    },
    link: {
      paddingVertical: 1,
      ...webPointer(),
    },
    linkText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const emphasisStyles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${brandColor}44`,
      backgroundColor: brandSubtle,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
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
      fontSize: 16,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
    },
    message: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
    },
  }));

  if (resolvedVariant === 'notice') {
    return (
      <View
        accessibilityRole="summary"
        accessibilityLabel={`${title}. ${message}`}
        style={noticeStyles.strip}
      >
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.labelTertiary}
          style={noticeStyles.icon}
        />
        <View style={noticeStyles.copy}>
          <Text style={noticeStyles.title}>{title}</Text>
          <View style={noticeStyles.messageRow}>
            <Text style={noticeStyles.message}>{message}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={buttonLabel}
              onPress={onUpgrade}
              style={noticeStyles.link}
            >
              <Text style={noticeStyles.linkText}>{buttonLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
      style={emphasisStyles.card}
    >
      <View style={emphasisStyles.header}>
        <View style={emphasisStyles.iconWrap}>
          <Ionicons name="sparkles-outline" size={20} color={brandColor} />
        </View>
        <View style={emphasisStyles.copy}>
          <Text style={emphasisStyles.title}>{title}</Text>
          <Text style={emphasisStyles.message}>{message}</Text>
        </View>
      </View>
      <OnboardingButton label={buttonLabel} variant="secondary" onPress={onUpgrade} />
    </View>
  );
}
