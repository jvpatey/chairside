import type { WorkerProfile } from '@chairside/api';
import {
  formatWorkerAddress,
  formatWorkerEducation,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { useThemedStyles } from '@/theme';

type ApplicationKitPreviewProps = {
  profile: WorkerProfile | null;
  displayName?: string | null;
  photoStoragePath?: string | null;
  showDefaultNote?: boolean;
};

export function ApplicationKitPreview({
  profile,
  displayName: displayNameProp,
  photoStoragePath,
  showDefaultNote = true,
}: ApplicationKitPreviewProps) {
  const { profile: authProfile } = useAuth();
  const displayName = displayNameProp ?? authProfile?.display_name;
  const resolvedPhotoPath = photoStoragePath ?? profile?.photo_storage_path;
  const photoUri = useWorkerPhotoUri(resolvedPhotoPath);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    preview: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    previewLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    headerText: { flex: 1, gap: 2 },
    previewName: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 16,
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
  const address = formatWorkerAddress(profile);

  return (
    <View style={styles.preview}>
      <Text style={styles.previewLabel}>Clinics will see</Text>
      <View style={styles.header}>
        <WorkerProfileAvatar displayName={displayName} photoUri={photoUri} size={48} />
        <View style={styles.headerText}>
          <Text style={styles.previewName}>{displayName?.trim() || 'Name not set'}</Text>
          <Text style={styles.previewLine}>{address || 'Address not set'}</Text>
        </View>
      </View>
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
