import type { WorkerProfile } from '@chairside/api';
import {
  formatWorkerEducation,
  getFillInNotificationModeLabel,
  getProvinceLabel,
  getRoleTypeLabel,
  getSpecialtyLabel,
  getTravelRadiusRangeLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type WorkerProfileViewProps = {
  profile: WorkerProfile | null;
  displayName?: string | null;
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

export function WorkerProfileView({ profile, displayName }: WorkerProfileViewProps) {
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
      <View style={styles.card}>
        <ProfileRow label="Status" value="Profile not started" />
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

  return (
    <View style={styles.card}>
      {displayName ? <ProfileRow label="Name" value={displayName} /> : null}
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
      <ProfileRow
        label="Fill-in alerts"
        value={
          profile.short_notice_available
            ? getFillInNotificationModeLabel(profile.fill_in_notification_mode)
            : 'Off'
        }
      />
      <ProfileRow
        label="Fill-in SMS"
        value={
          profile.fill_in_sms_opt_in && profile.phone
            ? 'On'
            : profile.fill_in_sms_opt_in
              ? 'On (phone missing)'
              : 'Off'
        }
      />
      <ProfileRow label="Phone" value={profile.phone ? profile.phone : ''} />
      <ProfileRow
        label="Job alerts"
        value={profile.job_notification_opt_in ? 'On' : 'Off'}
      />
    </View>
  );
}
