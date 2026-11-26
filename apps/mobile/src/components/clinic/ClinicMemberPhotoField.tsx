import { Pressable, Text, View } from 'react-native';

import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicMemberPhotoFieldProps = {
  displayName: string;
  photoUri?: string | null;
  isUploadingPhoto?: boolean;
  hasPhoto?: boolean;
  onPickPhoto: () => void;
  onRemovePhoto?: () => void;
};

/** Profile photo for a group member (name and title are no longer entered). */
export function ClinicMemberPhotoField({
  displayName,
  photoUri,
  isUploadingPhoto = false,
  hasPhoto = false,
  onPickPhoto,
  onRemovePhoto,
}: ClinicMemberPhotoFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing, typography }) => ({
    photoSection: { gap: spacing.sm, alignItems: 'center' as const },
    photoActions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    action: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    secondary: { ...typography.body, color: colors.labelSecondary },
  }));

  return (
    <View style={styles.photoSection}>
      <FormSectionHeader icon="camera-outline" label="Profile photo" />
      <Pressable
        onPress={onPickPhoto}
        disabled={isUploadingPhoto}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? 'Change profile photo' : 'Add profile photo'}>
        <WorkerProfileAvatar
          displayName={displayName}
          photoUri={photoUri}
          size={88}
          isLoading={isUploadingPhoto}
        />
      </Pressable>
      <View style={styles.photoActions}>
        <Pressable disabled={isUploadingPhoto} onPress={onPickPhoto}>
          <Text style={styles.action}>
            {isUploadingPhoto ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Add photo'}
          </Text>
        </Pressable>
        {hasPhoto && onRemovePhoto ? (
          <Pressable disabled={isUploadingPhoto} onPress={onRemovePhoto}>
            <Text style={styles.secondary}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
