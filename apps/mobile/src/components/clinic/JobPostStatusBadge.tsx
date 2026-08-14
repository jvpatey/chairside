import type { JobPostStatus } from '@chairside/config';
import { getJobPostStatusBadgeVariant, getJobPostStatusLabel } from '@chairside/config';
import type { ViewStyle } from 'react-native';

import { PillBadge, type PillBadgeSize } from '@/components/ui/PillBadge';
import { colorWithAlpha, useTheme } from '@/theme';

type JobPostStatusBadgeProps = {
  status: JobPostStatus;
  size?: PillBadgeSize;
  style?: ViewStyle;
};

export function JobPostStatusBadge({ status, size = 'md', style }: JobPostStatusBadgeProps) {
  const { colors, isDark } = useTheme();
  const variant = getJobPostStatusBadgeVariant(status);
  const label = getJobPostStatusLabel(status);

  const palette =
    variant === 'live'
      ? {
          color: colors.success,
          backgroundColor: colorWithAlpha(colors.success, isDark ? 0.18 : 0.1),
          borderColor: colorWithAlpha(colors.success, 0.28),
        }
      : variant === 'paused'
        ? {
            color: colors.warning,
            backgroundColor: colorWithAlpha(colors.warning, isDark ? 0.18 : 0.1),
            borderColor: colorWithAlpha(colors.warning, 0.28),
          }
        : variant === 'filled'
          ? {
              color: colors.info,
              backgroundColor: colorWithAlpha(colors.info, isDark ? 0.18 : 0.1),
              borderColor: colorWithAlpha(colors.info, 0.28),
            }
          : {
              color: colors.labelSecondary,
              backgroundColor: colors.fillSubtle,
              borderColor: colors.separator,
            };

  return (
    <PillBadge
      label={label}
      color={palette.color}
      backgroundColor={palette.backgroundColor}
      borderColor={palette.borderColor}
      size={size}
      style={[{ alignSelf: 'flex-start' }, style]}
    />
  );
}
