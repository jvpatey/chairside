import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  getApplicationStatusSummary,
  type ApplicationStatusSummary,
  type ApplicationStatusSummaryAudience,
  type ApplicationStatusSummaryInput,
} from '@/lib/applicationStatusSummary';
import { colorWithAlpha, fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type ApplicantReviewHeroProps = {
  avatar: ReactNode;
  title: string;
  meta?: string | null;
  /** Secondary line above the title (e.g. clinic name). */
  label?: ReactNode;
  /** Status or primary badge pinned to the top-right of the identity row. */
  trailingBadge?: ReactNode;
  badges?: ReactNode;
  status: ApplicationStatusSummaryInput & {
    audience: ApplicationStatusSummaryAudience;
    isHighlighted?: boolean;
  };
};

function statusIcon(
  variant: ApplicationStatusSummary['variant'],
): keyof typeof Ionicons.glyphMap {
  switch (variant) {
    case 'success':
      return 'checkmark-circle-outline';
    case 'warning':
      return 'alert-circle-outline';
    case 'info':
      return 'information-circle-outline';
    default:
      return 'pulse-outline';
  }
}

function useStatusVariantStyles(
  variant: ApplicationStatusSummary['variant'],
  audience: ApplicationStatusSummaryAudience,
) {
  const { colors, isDark } = useTheme();

  switch (variant) {
    case 'success':
      return {
        badgeBg: colors.tertiarySubtle,
        iconColor: colors.success,
      };
    case 'warning':
      return {
        badgeBg: colorWithAlpha(colors.warning, isDark ? 0.22 : 0.14),
        iconColor: colors.warning,
      };
    case 'info':
      return audience === 'worker'
        ? {
            badgeBg: colors.tertiarySubtle,
            iconColor: colors.tertiary,
          }
        : {
            badgeBg: colors.primarySubtle,
            iconColor: colors.primary,
          };
    default:
      return {
        badgeBg: colors.fillSubtle,
        iconColor: colors.labelSecondary,
      };
  }
}

/** Flat review hero — applicant identity + application status in one band. */
export function ApplicantReviewHero({
  avatar,
  title,
  meta,
  label,
  trailingBadge,
  badges,
  status,
}: ApplicantReviewHeroProps) {
  const summary = getApplicationStatusSummary(
    status,
    status.audience,
    { isHighlighted: status.isHighlighted },
  );
  const variantStyles = useStatusVariantStyles(summary?.variant ?? 'default', status.audience);

  const styles = useThemedStyles(({ colors, spacing, typography, radii }) => ({
    band: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      overflow: 'hidden' as const,
    },
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: summary ? spacing.md : spacing.lg,
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    title: {
      fontSize: 26,
      lineHeight: 32,
      fontFamily: fontBold,
      fontWeight: '700',
      letterSpacing: -0.4,
      color: colors.labelPrimary,
    },
    meta: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    trailingBadge: {
      flexShrink: 0,
      alignSelf: 'flex-start',
      marginLeft: spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
    statusDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    statusBlock: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
    },
    statusIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    statusText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    statusEyebrow: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase' as const,
      color: colors.labelTertiary,
    },
    statusHeadline: {
      fontSize: 17,
      lineHeight: 23,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    statusDescription: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelPrimary,
    },
    statusNextStep: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.band}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          {avatar}
          <View style={styles.identity}>
            {label != null ? (
              typeof label === 'string' ? (
                <Text style={styles.label} numberOfLines={2}>
                  {label}
                </Text>
              ) : (
                label
              )
            ) : null}
            <Text style={styles.title} numberOfLines={2}>
              {title}
            </Text>
            {meta ? (
              <Text style={styles.meta} numberOfLines={3}>
                {meta}
              </Text>
            ) : null}
          </View>
          {trailingBadge ? (
            <View style={styles.trailingBadge}>{trailingBadge}</View>
          ) : null}
        </View>
        {badges ? <View style={styles.badgeRow}>{badges}</View> : null}
      </View>

      {summary ? (
        <>
          <View style={styles.statusDivider} />
          <View style={styles.statusBlock} accessibilityRole="summary">
            <View
              style={[
                styles.statusIconBadge,
                { backgroundColor: variantStyles.badgeBg },
              ]}
            >
              <Ionicons
                name={statusIcon(summary.variant)}
                size={17}
                color={variantStyles.iconColor}
              />
            </View>
            <View style={styles.statusText}>
              <Text style={styles.statusEyebrow}>Application status</Text>
              <Text style={styles.statusHeadline}>{summary.headline}</Text>
              <Text style={styles.statusDescription}>{summary.description}</Text>
              {summary.nextStep ? (
                <Text style={styles.statusNextStep}>{summary.nextStep}</Text>
              ) : null}
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}
