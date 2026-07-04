import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta, formatOfferingLabel, getSpecialtyLabel } from '@chairside/config';
import { isMatchableSoftware } from '@chairside/core';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import {
  DetailBulletList,
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { CultureFitScreeningBadge } from '@/components/clinic/CultureFitScreeningBadge';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { FadeInSection } from '@/components/dashboard/FadeInSection';
import { getHeroBandGradient, useTheme, useThemedStyles } from '@/theme';

type JobPostDetailViewProps = {
  job: JobPost;
};

export function JobPostDetailView({ job }: JobPostDetailViewProps) {
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
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
  }));

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

      <FadeInSection delayMs={80}>
        <View style={styles.card}>
          <DetailSection>
            <DetailRow label="Compensation" value={job.wage_range} />
            <RowDivider />
            <DetailRow label="Schedule" value={job.schedule} />
          </DetailSection>

          <DetailSectionDivider>
            <DetailSection title="Practice">
              <DetailRow label="Specialty" value={getSpecialtyLabel(job.specialty)} />
              <RowDivider />
              <DetailRow label="Software" value={softwareLabel} />
            </DetailSection>
          </DetailSectionDivider>

          {offeringLabels.length > 0 ? (
            <DetailSectionDivider>
              <DetailSection title="Perks & offerings">
                <DetailBulletList items={offeringLabels} />
              </DetailSection>
            </DetailSectionDivider>
          ) : null}

          {description ? (
            <DetailSectionDivider>
              <DetailSection title="About">
                <DetailProse text={description} />
              </DetailSection>
            </DetailSectionDivider>
          ) : null}
        </View>
      </FadeInSection>
    </View>
  );
}
