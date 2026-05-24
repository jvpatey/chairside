import type { WorkerProfile } from '@chairside/api';
import { Text, View } from 'react-native';

import { ApplicationPackageFields } from '@/components/worker/ApplicationPackageFields';
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

  return (
    <View style={styles.preview}>
      <Text style={styles.previewLabel}>Clinics will see</Text>
      <ApplicationPackageFields
        profile={profile}
        displayName={displayName}
        photoUri={photoUri}
        showDefaultNote={showDefaultNote}
      />
    </View>
  );
}
