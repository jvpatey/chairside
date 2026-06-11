import type { WorkerProfile } from '@chairside/api';
import { getWorkerRoleTypes } from '@chairside/api';
import {
  formatWorkerEducation,
  getProvinceLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { DetailProse } from '@/components/clinic/DetailCard';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  ProfileEmptyState,
  ProfileSummaryBanner,
  SectionPanel,
  SummaryStat,
  SummaryStatRow,
} from '@/components/profile/ProfileDetailBlocks';
import { useThemedStyles } from '@/theme';

type WorkerProfessionalViewProps = {
  profile: WorkerProfile | null;
};

function RolePills({ roles }: { roles: string[] }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    pill: {
      borderRadius: 999,
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 1,
      backgroundColor: colors.primarySubtle,
      borderWidth: 1,
      borderColor: `${colors.primary}22`,
    },
    pillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    empty: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
  }));

  if (roles.length === 0) {
    return <Text style={styles.empty}>No roles selected yet</Text>;
  }

  return (
    <View style={styles.wrap}>
      {roles.map((role) => (
        <View key={role} style={styles.pill}>
          <Text style={styles.pillText}>{getRoleTypeLabel(role)}</Text>
        </View>
      ))}
    </View>
  );
}

function TagRow({ tags }: { tags: string[] }) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
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
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelTertiary,
      fontStyle: 'italic',
    },
  }));

  if (tags.length === 0) {
    return <Text style={styles.empty}>Not added yet</Text>;
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

export function WorkerProfessionalView({ profile }: WorkerProfessionalViewProps) {
  if (!profile) {
    return (
      <ProfileEmptyState
        icon="briefcase-outline"
        title="Build your professional background"
        description="Add your roles, experience, and location so clinics can match you to the right opportunities."
      />
    );
  }

  const roles = getWorkerRoleTypes(profile);
  const address = [
    profile.address_line1,
    profile.city,
    getProvinceLabel(profile.province),
    profile.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
  const locationSummary = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');
  const experienceSummary =
    profile.years_of_experience != null ? `${profile.years_of_experience} years` : 'Not added yet';
  const education = formatWorkerEducation(profile);
  const softwareTags = profile.software_used;
  const specialtyTags = profile.practice_types.map(getSpecialtyLabel);
  const travelLabel = getTravelRadiusRangeLabel(profile.travel_radius_range);

  return (
    <ProfileDetailStack>
      <ProfileSummaryBanner icon="briefcase-outline" title="At a glance">
        <RolePills roles={roles} />
        <SummaryStatRow>
          <SummaryStat icon="time-outline" label="Experience" value={experienceSummary} />
          <SummaryStat
            icon="location-outline"
            label="Location"
            value={locationSummary || 'Not added yet'}
          />
        </SummaryStatRow>
      </ProfileSummaryBanner>

      <SectionPanel icon="school-outline" title="Experience & education">
        <FieldBlock label="Years of experience">
          <FieldValue
            value={
              profile.years_of_experience != null
                ? `${profile.years_of_experience} years`
                : null
            }
          />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Education">
          <FieldValue value={education || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="navigate-outline" title="Location & travel">
        <FieldBlock label="Address">
          <FieldValue value={address || null} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Travel distance">
          <FieldValue value={travelLabel || null} />
        </FieldBlock>
      </SectionPanel>

      <SectionPanel icon="sparkles-outline" title="Skills & bio">
        <FieldBlock label="Software">
          <TagRow tags={softwareTags} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Practice types">
          <TagRow tags={specialtyTags} />
        </FieldBlock>
        <FieldDivider />
        <FieldBlock label="Bio">
          {profile.bio?.trim() ? (
            <DetailProse text={profile.bio.trim()} />
          ) : (
            <FieldValue value={null} />
          )}
        </FieldBlock>
      </SectionPanel>
    </ProfileDetailStack>
  );
}
