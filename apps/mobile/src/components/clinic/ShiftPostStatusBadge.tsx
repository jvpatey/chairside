import type { ShiftPostStatus } from '@chairside/api';
import { Text, View, type ViewStyle } from 'react-native';

import { isExpiredLiveShift } from '@/lib/fillInFilters';
import { useThemedStyles } from '@/theme';

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
  const variant = getShiftPostStatusBadgeVariant(status, shiftDate);
  const label = getShiftPostStatusLabel(status, shiftDate);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    badge: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    badgeOpen: {
      backgroundColor: `${colors.destructive}1A`,
      borderWidth: 1,
      borderColor: `${colors.destructive}40`,
    },
    badgeFilled: {
      backgroundColor: `${colors.success}1A`,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
    },
    badgeDraft: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    badgeClosed: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    badgeExpired: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    textOpen: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.destructive,
    },
    textFilled: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    textDraft: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    textClosed: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    textExpired: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  const badgeStyle = [
    styles.badge,
    variant === 'open' && styles.badgeOpen,
    variant === 'filled' && styles.badgeFilled,
    variant === 'draft' && styles.badgeDraft,
    variant === 'closed' && styles.badgeClosed,
    variant === 'expired' && styles.badgeExpired,
    style,
  ];

  const textStyle =
    variant === 'open'
      ? styles.textOpen
      : variant === 'filled'
        ? styles.textFilled
        : variant === 'draft'
          ? styles.textDraft
          : variant === 'expired'
            ? styles.textExpired
            : styles.textClosed;

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}
