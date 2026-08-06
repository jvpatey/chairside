import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta, formatOfferingLabel, getSpecialtyLabel } from '@chairside/config';
import { isMatchableSoftware } from '@chairside/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

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
import { getHeroBandGradient, radii, useTheme, useThemedStyles } from '@/theme';

type JobPostDetailPart = 'all' | 'hero' | 'body';

type JobPostDetailViewProps = {
  job: JobPost;
  /** Render only the hero band, only the detail sections, or both (default). */
  part?: JobPostDetailPart;
};

export function JobPostDetailView({ job, part = 'all' }: JobPostDetailViewProps) {
  const { colors, isDark } = useTheme();
  const metaLine = formatJobPostRoleMeta(job);
  const matchableSoftware = job.software_used.filter(isMatchableSoftware);
  const softwareLabel = matchableSoftware.length > 0 ? matchableSoftware.join(' · ') : null;
  const description = job.description?.trim() || null;
  const offeringLabels = job.offerings.map(formatOfferingLabel);
  const heroGradient = getHeroBandGradient(colors, isDark, 'primary');

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.lg,
    },
    heroBand: {
      position: 'relative',
      borderRadius: radii.lg,
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
      color: colors.primary,
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
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    statusBadge: {
      position: 'absolute',
      top: spacing.lg,
      right: spacing.lg,
      zIndex: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
  }));

  const showHero = part === 'all' || part === 'hero';
  const showBody = part === 'all' || part === 'body';

  return (
    <View style={styles.wrap}>
      {showHero ? (
        <FadeInSection delayMs={0}>
          <View style={styles.heroBand}>
            <LinearGradient
              colors={heroGradient}
              locations={[0, 0.2, 0.45, 0.7, 0.88, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
              pointerEvents="none"
            />
            <View style={styles.hero}>
              <JobPostStatusBadge status={job.status} style={styles.statusBadge} />

              <View style={styles.heroTop}>
                <Text style={styles.overline}>Open role</Text>
                <Text style={styles.title}>{job.title}</Text>
              </View>

              <Text style={styles.meta}>{metaLine}</Text>

              {Boolean(job.screening_enabled) ? (
                <View style={styles.badgeRow}>
                  <CultureFitScreeningBadge />
                </View>
              ) : null}
            </View>
          </View>
        </FadeInSection>
      ) : null}

      {showBody ? (
        <FadeInSection delayMs={showHero ? 80 : 0}>
        <View style={styles.card}>
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
        </View>
      </FadeInSection>
      ) : null}
    </View>
  );
}
