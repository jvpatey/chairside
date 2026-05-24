import type { WorkerProfile } from '@chairside/api';
import { formatWorkerEducation, getRoleTypeLabel, getSpecialtyLabel } from '@chairside/config';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ApplicationKitPreviewProps = {
  profile: WorkerProfile | null;
  showDefaultNote?: boolean;
};

export function ApplicationKitPreview({
  profile,
  showDefaultNote = true,
}: ApplicationKitPreviewProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    preview: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    previewLine: typography.subtitle,
    empty: { ...typography.subtitle, fontStyle: 'italic' },
  }));

  if (!profile) {
    return (
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>Clinics will see</Text>
        <Text style={styles.empty}>Complete your professional background first.</Text>
      </View>
    );
  }

  const software =
    profile.software_used.length > 0 ? profile.software_used.join(', ') : null;
  const specialties =
    profile.practice_types.length > 0
      ? profile.practice_types.map(getSpecialtyLabel).join(', ')
      : null;

  return (
    <View style={styles.preview}>
      <Text style={styles.previewLabel}>Clinics will see</Text>
      <Text style={styles.previewLine}>
        {profile.role_type ? getRoleTypeLabel(profile.role_type) : 'Role not set'}
      </Text>
      <Text style={styles.previewLine}>
        {profile.years_of_experience != null
          ? `${profile.years_of_experience} years experience`
          : 'Experience not set'}
      </Text>
      <Text style={styles.previewLine}>
        {formatWorkerEducation(profile) || 'Education not set'}
      </Text>
      <Text style={styles.previewLine}>
        {software ? `Software: ${software}` : 'Software not set'}
      </Text>
      <Text style={styles.previewLine}>
        {specialties ? `Specialties: ${specialties}` : 'Specialties not set'}
      </Text>
      {showDefaultNote && profile.default_cover_message ? (
        <Text style={styles.previewLine}>Default note: {profile.default_cover_message}</Text>
      ) : null}
    </View>
  );
}
