import type { ShiftPost } from '@chairside/api';
import { isMatchableSoftware } from '@chairside/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { formatShiftPostDateLabel, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { formatTimeRangePreview } from '@/lib/time';
import { getHeroBandGradient, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

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
  accent = 'secondary',
}: ShiftPostDetailViewProps) {
  const { colors, isDark } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const dateLabel = formatShiftPostDateLabel(shift.shift_date);
  const hoursLabel = formatTimeRangePreview(shift.start_time, shift.end_time);
  const description = shift.description?.trim() || null;
  const matchableSoftware = (softwareUsed ?? []).filter(isMatchableSoftware);
  const softwareLabel =
    matchableSoftware.length > 0 ? matchableSoftware.join(' · ') : null;
  const heroGradient = getHeroBandGradient(colors, isDark, accent);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    heroBand: {
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.separator,
    },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
    },
    hero: {
      position: 'relative',
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
        <FadeInSection delayMs={0}>{detailSection}</FadeInSection>
        {description ? (
          <FadeInSection delayMs={80}>
            <DetailSection title="Notes">
              <DetailProse text={description} />
            </DetailSection>
          </FadeInSection>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FadeInSection delayMs={0}>
        <View style={styles.heroBand}>
          <LinearGradient
            colors={heroGradient}
            locations={[0, 0.35, 0.65, 0.85, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
            pointerEvents="none"
          />
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
        </View>
      </FadeInSection>

      <FadeInSection delayMs={80}>{detailSection}</FadeInSection>
    </View>
  );
}
