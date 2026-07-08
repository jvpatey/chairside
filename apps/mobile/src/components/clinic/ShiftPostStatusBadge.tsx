import type { ShiftPostStatus } from '@chairside/api';
import type { ViewStyle } from 'react-native';

import { PillBadge } from '@/components/ui/PillBadge';
import { isExpiredLiveShift } from '@/lib/fillInFilters';
import { colorWithAlpha, useTheme } from '@/theme';

type ShiftPostStatusBadgeProps = {
  status: ShiftPostStatus;
  shiftDate?: string | null;
  style?: ViewStyle;
};

type BadgeVariant = 'open' | 'filled' | 'draft' | 'closed' | 'expired';

function getShiftPostStatusBadgeVariant(
  status: ShiftPostStatus,
  shiftDate?: string | null,
): BadgeVariant {
  if (status === 'live' && shiftDate && isExpiredLiveShift({ status, shift_date: shiftDate })) {
    return 'expired';
  }

  switch (status) {
    case 'live':
      return 'open';
    case 'filled':
      return 'filled';
    case 'draft':
      return 'draft';
    case 'closed':
      return 'closed';
  }
}

/** Fill-in shifts use coverage language, not generic job-post "Live". */
function getShiftPostStatusLabel(status: ShiftPostStatus, shiftDate?: string | null): string {
  if (status === 'live' && shiftDate && isExpiredLiveShift({ status, shift_date: shiftDate })) {
    return 'Expired';
  }

  switch (status) {
    case 'live':
      return 'Open';
    case 'filled':
      return 'Filled';
    case 'draft':
      return 'Draft';
    case 'closed':
      return 'Closed';
  }
}

export function ShiftPostStatusBadge({ status, shiftDate, style }: ShiftPostStatusBadgeProps) {
  const { colors, isDark } = useTheme();
  const variant = getShiftPostStatusBadgeVariant(status, shiftDate);
  const label = getShiftPostStatusLabel(status, shiftDate);

  const palette =
    variant === 'open'
      ? {
          color: colors.destructive,
          backgroundColor: colorWithAlpha(colors.destructive, isDark ? 0.18 : 0.1),
          borderColor: colorWithAlpha(colors.destructive, 0.28),
        }
      : variant === 'filled'
        ? {
            color: colors.success,
            backgroundColor: colorWithAlpha(colors.success, isDark ? 0.18 : 0.1),
            borderColor: colorWithAlpha(colors.success, 0.28),
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
