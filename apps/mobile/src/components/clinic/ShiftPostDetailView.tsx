import type { ShiftPost } from '@chairside/api';
import { isMatchableSoftware } from '@chairside/core';
import { Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { formatShiftPostDateLabel, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { formatTimeRangePreview } from '@/lib/time';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type ShiftPostDetailViewProps = {
  shift: ShiftPost;
  softwareUsed?: string[] | null;
  showStatusBadge?: boolean;
  /** Compact labeled rows for inline expandable cards (no hero). */
  variant?: 'full' | 'embedded';
  accent?: GradientAccent;
};

export function ShiftPostDetailView({
  shift,
  softwareUsed,
  showStatusBadge = true,
  variant = 'full',
  accent = 'primary',
}: ShiftPostDetailViewProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const dateLabel = formatShiftPostDateLabel(shift.shift_date);
  const hoursLabel = formatTimeRangePreview(shift.start_time, shift.end_time);
  const description = shift.description?.trim() || null;
  const matchableSoftware = (softwareUsed ?? []).filter(isMatchableSoftware);
  const softwareLabel =
    matchableSoftware.length > 0 ? matchableSoftware.join(' · ') : null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    hero: {
      position: 'relative',
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.md,
    },
    heroTop: {
      gap: spacing.xs,
      paddingRight: 72,
    },
    overline: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: brandColor,
    },
    title: {
      ...typography.title,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.4,
    },
    meta: {
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelSecondary,
    },
    statusBadge: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.lg,
      zIndex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
  }));

  const detailSection = (
    <View style={variant === 'embedded' ? undefined : styles.card}>
      <DetailSection title={variant === 'embedded' ? 'Details' : 'Shift details'}>
        <DetailRow label="Date" value={dateLabel} />
        <RowDivider />
        <DetailRow label="Hours" value={hoursLabel} />
        <RowDivider />
        <DetailRow label="Compensation" value={shift.compensation} />
        {softwareLabel ? (
          <>
            <RowDivider />
            <DetailRow label="Software" value={softwareLabel} />
          </>
        ) : null}
      </DetailSection>

      {description && variant === 'full' ? (
        <DetailSectionDivider>
          <DetailSection title="Notes">
            <DetailProse text={description} />
          </DetailSection>
        </DetailSectionDivider>
      ) : null}
    </View>
  );

  if (variant === 'embedded') {
    return (
      <View style={styles.wrap}>
        {detailSection}
        {description ? (
          <DetailSection title="Notes">
            <DetailProse text={description} />
          </DetailSection>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        {showStatusBadge ? (
          <ShiftPostStatusBadge
            status={shift.status}
            shiftDate={shift.shift_date}
            style={styles.statusBadge}
          />
        ) : null}

        <View style={styles.heroTop}>
          <Text style={styles.overline}>Fill-in shift</Text>
          <Text style={styles.title}>{formatShiftPostRoleTitle(shift.role_type)}</Text>
        </View>

        <Text style={styles.meta}>{dateLabel}</Text>
      </View>

      {detailSection}
    </View>
  );
}
