import type { JobPostStatus } from '@chairside/config';
import { getJobPostStatusBadgeVariant, getJobPostStatusLabel } from '@chairside/config';
import { Text, View, type ViewStyle } from 'react-native';

import { useThemedStyles } from '@/theme';

type JobPostStatusBadgeProps = {
  status: JobPostStatus;
  style?: ViewStyle;
};

export function JobPostStatusBadge({ status, style }: JobPostStatusBadgeProps) {
  const variant = getJobPostStatusBadgeVariant(status);
  const label = getJobPostStatusLabel(status);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    badge: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeLive: {
      backgroundColor: `${colors.success}1A`,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
    },
    badgePaused: {
      backgroundColor: `${colors.warning}1A`,
      borderWidth: 1,
      borderColor: `${colors.warning}40`,
    },
    badgeFilled: {
      backgroundColor: `${colors.info}1A`,
      borderWidth: 1,
      borderColor: `${colors.info}40`,
    },
    badgeArchived: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    badgeNeutral: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    textLive: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    textPaused: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.warning,
    },
    textFilled: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.info,
    },
    textArchived: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    textNeutral: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  const badgeStyle = [
    styles.badge,
    variant === 'live' && styles.badgeLive,
    variant === 'paused' && styles.badgePaused,
    variant === 'filled' && styles.badgeFilled,
    (variant === 'archived' || variant === 'neutral') && styles.badgeArchived,
    style,
  ];

  const textStyle =
    variant === 'live'
      ? styles.textLive
      : variant === 'paused'
        ? styles.textPaused
        : variant === 'filled'
          ? styles.textFilled
          : styles.textArchived;

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
