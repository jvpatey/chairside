import type { ShiftPost } from '@chairside/api';
import { isMatchableSoftware } from '@chairside/core';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { formatShiftPostDateLabel, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { formatTimeRangePreview } from '@/lib/time';
import { fontBold, fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type ShiftPostDetailViewProps = {
  shift: ShiftPost;
  softwareUsed?: string[] | null;
  showStatusBadge?: boolean;
  /** Compact labeled rows for inline expandable cards (no hero). */
  variant?: 'full' | 'embedded';
  accent?: GradientAccent;
  /** Render only the role hero, only shift details, or both (default). */
  section?: 'full' | 'hero' | 'details';
  /** Optional badges rendered below the hero row (e.g. urgency). */
  heroAccessory?: ReactNode;
  /** Site location for group postings (Shift details section). */
  locationLabel?: string | null;
};

export function ShiftPostDetailView({
  shift,
  softwareUsed,
  showStatusBadge = true,
  variant = 'full',
  accent = 'secondary',
  section = 'full',
  heroAccessory,
  locationLabel,
}: ShiftPostDetailViewProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const brandSubtle =
    accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle;
  const dateLabel = formatShiftPostDateLabel(shift.shift_date);
  const hoursLabel = formatTimeRangePreview(shift.start_time, shift.end_time);
  const description = shift.description?.trim() || null;
  const matchableSoftware = (softwareUsed ?? []).filter(isMatchableSoftware);
  const softwareLabel =
    matchableSoftware.length > 0 ? matchableSoftware.join(' · ') : null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    heroRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.md,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: brandSubtle,
      flexShrink: 0,
    },
    heroText: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    overline: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
      color: brandColor,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: fontBold,
      fontWeight: '700' as const,
      letterSpacing: -0.35,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    statusBadge: {
      flexShrink: 0,
      marginTop: 2,
    },
  }));

  const detailRows = (
    <CardDetailSection title={variant === 'embedded' ? 'Details' : 'Shift details'}>
      {locationLabel?.trim() ? (
        <>
          <DetailRow label="Location" value={locationLabel} />
          <RowDivider />
        </>
      ) : null}
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
    </CardDetailSection>
  );

  if (variant === 'embedded') {
    return (
      <View style={styles.wrap}>
        <FadeInSection delayMs={0}>{detailRows}</FadeInSection>
        {description ? (
          <FadeInSection delayMs={80}>
            <CardDetailSection title="Notes">
              <DetailProse text={description} />
            </CardDetailSection>
          </FadeInSection>
        ) : null}
      </View>
    );
  }

  const showHero = section === 'full' || section === 'hero';
  const showDetails = section === 'full' || section === 'details';

  const heroSection = (
    <FadeInSection delayMs={0}>
      <SurfaceCard padding="lg" gap elevationLevel="subtle">
        <View style={styles.heroRow}>
          <View style={styles.iconBadge}>
            <Ionicons name={FILL_IN_ICON.outline} size={18} color={brandColor} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.overline}>Fill-in shift</Text>
            <Text style={styles.title}>{formatShiftPostRoleTitle(shift.role_type)}</Text>
            <Text style={styles.meta}>{dateLabel}</Text>
          </View>
          {showStatusBadge ? (
            <ShiftPostStatusBadge
              status={shift.status}
              shiftDate={shift.shift_date}
              style={styles.statusBadge}
            />
          ) : null}
        </View>
        {heroAccessory ? <BadgeRow>{heroAccessory}</BadgeRow> : null}
      </SurfaceCard>
    </FadeInSection>
  );

  const detailsSection = (
    <FadeInSection delayMs={showHero ? 80 : 0}>
      <SurfaceCard padding="lg" gap elevationLevel="subtle">
        {detailRows}
        {description ? (
          <CardDetailSection title="Notes" divided>
            <DetailProse text={description} />
          </CardDetailSection>
        ) : null}
      </SurfaceCard>
    </FadeInSection>
  );

  return (
    <View style={styles.wrap}>
      {showHero ? heroSection : null}
      {showDetails ? detailsSection : null}
    </View>
  );
}
