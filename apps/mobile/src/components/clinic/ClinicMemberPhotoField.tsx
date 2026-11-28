import { Pressable, Text, View } from 'react-native';

import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type ClinicMemberPhotoFieldProps = {
  displayName: string;
  label?: string;
  photoUri?: string | null;
  isUploadingPhoto?: boolean;
  hasPhoto?: boolean;
  onPickPhoto: () => void;
  onRemovePhoto?: () => void;
};

/** Centered photo control for the Group & clinics card. */
export function ClinicMemberPhotoField({
  displayName,
  label = 'Group photo',
  photoUri,
  isUploadingPhoto = false,
  hasPhoto = false,
  onPickPhoto,
  onRemovePhoto,
}: ClinicMemberPhotoFieldProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    action: {
      fontSize: 15,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    secondary: {
      fontSize: 15,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={onPickPhoto}
        disabled={isUploadingPhoto}
        accessibilityRole="button"
        accessibilityLabel={hasPhoto ? `Change ${label.toLowerCase()}` : `Add ${label.toLowerCase()}`}>
        <WorkerProfileAvatar
          displayName={displayName}
          photoUri={photoUri}
          size={76}
          isLoading={isUploadingPhoto}
        />
      </Pressable>
      <View style={styles.actions}>
        <Pressable disabled={isUploadingPhoto} onPress={onPickPhoto} hitSlop={6}>
          <Text style={styles.action}>
            {isUploadingPhoto ? 'Uploading…' : hasPhoto ? 'Change photo' : 'Add photo'}
          </Text>
        </Pressable>
        {hasPhoto && onRemovePhoto ? (
          <Pressable disabled={isUploadingPhoto} onPress={onRemovePhoto} hitSlop={6}>
            <Text style={styles.secondary}>Remove</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
