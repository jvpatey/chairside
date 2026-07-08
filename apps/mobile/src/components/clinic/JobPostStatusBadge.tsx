import type { JobPostStatus } from '@chairside/config';
import { getJobPostStatusBadgeVariant, getJobPostStatusLabel } from '@chairside/config';
import type { ViewStyle } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { colorWithAlpha, useTheme } from '@/theme';

type JobPostStatusBadgeProps = {
  status: JobPostStatus;
  style?: ViewStyle;
};

export function JobPostStatusBadge({ status, style }: JobPostStatusBadgeProps) {
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
      style={[{ alignSelf: 'center' }, style]}
    />
  );
}
