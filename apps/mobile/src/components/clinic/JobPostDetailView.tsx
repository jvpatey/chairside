import type { JobPost } from '@chairside/api';
import { formatJobPostRoleMeta, formatOfferingLabel, getSpecialtyLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import {
  DetailBulletList,
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { JobPostStatusBadge } from '@/components/clinic/JobPostStatusBadge';
import { useThemedStyles } from '@/theme';

type JobPostDetailViewProps = {
  job: JobPost;
};

export function JobPostDetailView({ job }: JobPostDetailViewProps) {
  const metaLine = formatJobPostRoleMeta(job);
  const softwareLabel = job.software_used.length > 0 ? job.software_used.join(' · ') : null;
  const description = job.description?.trim() || null;
  const offeringLabels = job.offerings.map(formatOfferingLabel);

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
      <View style={styles.hero}>
        <JobPostStatusBadge status={job.status} style={styles.statusBadge} />

        <View style={styles.heroTop}>
          <Text style={styles.overline}>Open role</Text>
          <Text style={styles.title}>{job.title}</Text>
        </View>

        <Text style={styles.meta}>{metaLine}</Text>
      </View>

      <View style={styles.card}>
        <DetailSection title="Compensation & schedule">
          <DetailRow label="Wage range" value={job.wage_range} />
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
    </View>
  );
}
