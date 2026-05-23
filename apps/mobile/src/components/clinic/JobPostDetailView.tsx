import type { JobPost } from '@chairside/api';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  ROLE_TYPE_OPTIONS,
  SPECIALTY_OPTIONS,
} from '@chairside/config';
import { Text, View } from 'react-native';

import {
  DetailBulletList,
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

const STATUS_LABELS: Record<JobPost['status'], string> = {
  draft: 'Draft',
  live: 'Live',
  filled: 'Filled',
  closed: 'Closed',
};

type JobPostDetailViewProps = {
  job: JobPost;
};

export function JobPostDetailView({ job }: JobPostDetailViewProps) {
  const roleLabel =
    ROLE_TYPE_OPTIONS.find((option) => option.value === job.role_type)?.label ?? job.role_type;
  const employmentLabel =
    EMPLOYMENT_TYPE_OPTIONS.find((option) => option.value === job.employment_type)?.label ??
    job.employment_type;
  const specialtyLabel =
    SPECIALTY_OPTIONS.find((option) => option.value === job.specialty)?.label ?? job.specialty;
  const softwareLabel = job.software_used.length > 0 ? job.software_used.join(' · ') : null;
  const description = job.description?.trim() || null;

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
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      zIndex: 1,
    },
    statusBadgeLive: {
      backgroundColor: `${colors.success}1A`,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
    },
    statusBadgeLiveText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    statusBadgeDefault: {
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    statusBadgeDefaultText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
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

  const isLive = job.status === 'live';

  return (
    <View style={styles.wrap}>
      <View style={styles.hero}>
        <View
          style={[
            styles.statusBadge,
            isLive ? styles.statusBadgeLive : styles.statusBadgeDefault,
          ]}>
          <Text style={isLive ? styles.statusBadgeLiveText : styles.statusBadgeDefaultText}>
            {STATUS_LABELS[job.status]}
          </Text>
        </View>

        <View style={styles.heroTop}>
          <Text style={styles.overline}>Open role</Text>
          <Text style={styles.title}>{job.title}</Text>
        </View>

        <Text style={styles.meta}>
          {roleLabel} · {employmentLabel}
        </Text>
      </View>

      <View style={styles.card}>
        <DetailSection title="Compensation & schedule">
          <DetailRow label="Wage range" value={job.wage_range} />
          <RowDivider />
          <DetailRow label="Schedule" value={job.schedule} />
        </DetailSection>

        <DetailSectionDivider>
          <DetailSection title="Practice">
            <DetailRow label="Specialty" value={specialtyLabel} />
            <RowDivider />
            <DetailRow label="Software" value={softwareLabel} />
          </DetailSection>
        </DetailSectionDivider>

        {job.offerings.length > 0 ? (
          <DetailSectionDivider>
            <DetailSection title="Perks & offerings">
              <DetailBulletList items={job.offerings} />
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
