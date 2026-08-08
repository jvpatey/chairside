import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta, formatOfferingLabel, getSpecialtyLabel } from '@chairside/config';
import { isMatchableSoftware } from '@chairside/core';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import {
  DetailBulletList,
  DetailProse,
  DetailRow,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { CultureFitScreeningBadge } from '@/components/clinic/CultureFitScreeningBadge';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { fontBold, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type JobPostDetailPart = 'all' | 'hero' | 'body';

type JobPostDetailViewProps = {
  job: JobPost;
  /** Render only the hero band, only the detail sections, or both (default). */
  part?: JobPostDetailPart;
};

export function JobPostDetailView({ job, part = 'all' }: JobPostDetailViewProps) {
  const { colors } = useTheme();
  const metaLine = formatJobPostRoleMeta(job);
  const matchableSoftware = job.software_used.filter(isMatchableSoftware);
  const softwareLabel = matchableSoftware.length > 0 ? matchableSoftware.join(' · ') : null;
  const description = job.description?.trim() || null;
  const offeringLabels = job.offerings.map(formatOfferingLabel);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: spacing.lg,
    },
    heroRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    iconBadge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
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
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      fontSize: 24,
      lineHeight: 30,
      fontFamily: fontBold,
      fontWeight: '700',
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

  const showHero = part === 'all' || part === 'hero';
  const showBody = part === 'all' || part === 'body';

  return (
    <View style={styles.wrap}>
      {showHero ? (
        <FadeInSection delayMs={0}>
          <SurfaceCard padding="lg" gap elevationLevel="subtle">
            <View style={styles.heroRow}>
              <View style={styles.iconBadge}>
                <Ionicons name="briefcase-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.overline}>Open role</Text>
                <Text style={styles.title}>{job.title}</Text>
                <Text style={styles.meta}>{metaLine}</Text>
              </View>
              <JobPostStatusBadge status={job.status} style={styles.statusBadge} />
            </View>
            {Boolean(job.screening_enabled) ? (
              <BadgeRow>
                <CultureFitScreeningBadge />
              </BadgeRow>
            ) : null}
          </SurfaceCard>
        </FadeInSection>
      ) : null}

      {showBody ? (
        <FadeInSection delayMs={showHero ? 80 : 0}>
          <SurfaceCard padding="lg" gap elevationLevel="subtle">
            <CardDetailSection>
              <DetailRow label="Compensation" value={job.wage_range} />
              <RowDivider />
              <DetailRow label="Schedule" value={job.schedule} />
            </CardDetailSection>

            <CardDetailSection title="Practice" divided>
              <DetailRow label="Specialty" value={getSpecialtyLabel(job.specialty)} />
              <RowDivider />
              <DetailRow label="Software" value={softwareLabel} />
            </CardDetailSection>

            {offeringLabels.length > 0 ? (
              <CardDetailSection title="Perks & offerings" divided>
                <DetailBulletList items={offeringLabels} />
              </CardDetailSection>
            ) : null}

            {description ? (
              <CardDetailSection title="About" divided>
                <DetailProse text={description} />
              </CardDetailSection>
            ) : null}
          </SurfaceCard>
        </FadeInSection>
      ) : null}
    </View>
  );
}
