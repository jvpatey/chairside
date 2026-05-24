import type { WorkerProfile } from '@chairside/api';
import {
  formatWorkerEducation,
  getProvinceLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { ProfileSection } from '@/components/worker/ProfileSection';
import { useThemedStyles } from '@/theme';

type WorkerProfessionalViewProps = {
  profile: WorkerProfile | null;
};

function ProfileRow({ label, value }: { label: string; value: string }) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    label: { fontSize: 13, fontWeight: '600', color: typography.subtitle.color },
    value: typography.body,
  }));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
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
      padding: spacing.lg,
    },
  }));

  if (!profile) {
    return (
      <ProfileSection
        title="Professional background"
        subtitle="Your role, experience, and location — the facts clinics need to know about you.">
        <View style={styles.card}>
          <ProfileRow label="Status" value="Not started" />
        </View>
      </ProfileSection>
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

  return (
    <ProfileSection
      title="Professional background"
      subtitle="Your role, experience, and location — the facts clinics need to know about you.">
      <View style={styles.card}>
        <ProfileRow
          label="Role"
          value={profile.role_type ? getRoleTypeLabel(profile.role_type) : ''}
        />
        <ProfileRow
          label="Experience"
          value={
            profile.years_of_experience != null ? `${profile.years_of_experience} years` : ''
          }
        />
        <ProfileRow label="Education" value={formatWorkerEducation(profile)} />
        <ProfileRow
          label="Software"
          value={profile.software_used.length > 0 ? profile.software_used.join(', ') : ''}
        />
        <ProfileRow label="Address" value={address} />
        <ProfileRow
          label="Travel distance"
          value={getTravelRadiusRangeLabel(profile.travel_radius_range)}
        />
        <ProfileRow
          label="Practice types"
          value={
            profile.practice_types.length > 0
              ? profile.practice_types.map(getSpecialtyLabel).join(', ')
              : ''
          }
        />
        <ProfileRow label="Bio" value={profile.bio ?? ''} />
      </View>
    </ProfileSection>
  );
}
