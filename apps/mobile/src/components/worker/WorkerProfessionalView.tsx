import type { WorkerProfile } from '@chairside/api';
import {
  formatWorkerEducation,
  getProvinceLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import {
  DetailProse,
  DetailRow,
  DetailSection,
  DetailSectionDivider,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { useThemedStyles } from '@/theme';

type WorkerProfessionalViewProps = {
  profile: WorkerProfile | null;
};

function ProfileTagRow({ tags }: { tags: string[] }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingBottom: spacing.xs,
    },
    tag: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      backgroundColor: colors.fillSubtle,
      borderWidth: 1,
      borderColor: colors.separator,
    },
    tagText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    empty: {
      ...typography.subtitle,
      fontSize: 15,
      color: colors.labelTertiary,
      paddingBottom: spacing.xs,
    },
  }));

  if (tags.length === 0) {
    return <Text style={styles.empty}>—</Text>;
  }

  return (
    <View style={styles.wrap}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function TagField({ label, tags }: { label: string; tags: string[] }) {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    field: { gap: spacing.xs, paddingVertical: spacing.sm + 2 },
    label: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <ProfileTagRow tags={tags} />
    </View>
  );
}

export function WorkerProfessionalView({ profile }: WorkerProfessionalViewProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.lg,
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
    },
    emptyText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelSecondary,
      textAlign: 'center',
    },
    bioField: { gap: spacing.xs, paddingVertical: spacing.sm + 2 },
    bioLabel: {
      fontSize: 15,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    bioEmpty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
    },
  }));

  if (!profile) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>
          Add your role, experience, and location so clinics can match you to opportunities.
        </Text>
      </View>
    );
  }

  const address = [
    profile.address_line1,
    profile.city,
    getProvinceLabel(profile.province),
    profile.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  const softwareTags = profile.software_used;
  const specialtyTags = profile.practice_types.map(getSpecialtyLabel);

  return (
    <View style={styles.card}>
      <DetailSection title="Role & experience">
        <DetailRow
          label="Role"
          value={profile.role_type ? getRoleTypeLabel(profile.role_type) : null}
        />
        <RowDivider />
        <DetailRow
          label="Experience"
          value={
            profile.years_of_experience != null ? `${profile.years_of_experience} years` : null
          }
        />
        <RowDivider />
        <DetailRow label="Education" value={formatWorkerEducation(profile)} />
      </DetailSection>

      <DetailSectionDivider>
        <DetailSection title="Location & travel">
          <DetailRow label="Address" value={address || null} layout="stacked" />
          <RowDivider />
          <DetailRow
            label="Travel distance"
            value={getTravelRadiusRangeLabel(profile.travel_radius_range)}
          />
        </DetailSection>
      </DetailSectionDivider>

      <DetailSectionDivider>
        <DetailSection title="Skills & bio">
          <TagField label="Software" tags={softwareTags} />
          <RowDivider />
          <TagField label="Practice types" tags={specialtyTags} />
          <RowDivider />
          <View style={styles.bioField}>
            <Text style={styles.bioLabel}>Bio</Text>
            {profile.bio?.trim() ? (
              <DetailProse text={profile.bio.trim()} />
            ) : (
              <Text style={styles.bioEmpty}>—</Text>
            )}
          </View>
        </DetailSection>
      </DetailSectionDivider>
    </View>
  );
}
