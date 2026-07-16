import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicMemberProfileFieldsProps = {
  displayName: string;
  title: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onBioChange: (value: string) => void;
  namePlaceholder?: string;
  titlePlaceholder?: string;
  photoUri?: string | null;
  isUploadingPhoto?: boolean;
  hasPhoto?: boolean;
  onPickPhoto?: () => void;
  onRemovePhoto?: () => void;
  showValidation?: boolean;
  nameInvalid?: boolean;
  /** Compact mode for embedding in setup without photo remove confirm UI extras. */
  showPhotoSection?: boolean;
};

/** Shared name / title / bio / photo fields for group member self-profile. */
export function ClinicMemberProfileFields({
  displayName,
  title,
  bio,
  onDisplayNameChange,
  onTitleChange,
  onBioChange,
  namePlaceholder = 'Alex Rivera',
  titlePlaceholder = 'Owner',
  photoUri,
  isUploadingPhoto = false,
  hasPhoto = false,
  onPickPhoto,
  onRemovePhoto,
  showValidation = false,
  nameInvalid = false,
  showPhotoSection = true,
}: ClinicMemberProfileFieldsProps) {
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
    hint: typography.subtitle,
  }));

  return (
    <>
      {showPhotoSection && onPickPhoto ? (
        <View style={styles.photoSection}>
          <Text style={styles.hint}>Profile photo (optional)</Text>
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
      ) : null}
      <AuthField
        label="Your name"
        placeholder={namePlaceholder}
        value={displayName}
        onChangeText={onDisplayNameChange}
        autoCapitalize="words"
        invalid={showValidation && nameInvalid}
      />
      <AuthField
        label="Your title"
        placeholder={titlePlaceholder}
        value={title}
        onChangeText={onTitleChange}
        autoCapitalize="words"
      />
      <AuthField
        label="Bio (optional)"
        placeholder="A short note about your role on the team"
        value={bio}
        onChangeText={onBioChange}
        multiline
        autoCapitalize="sentences"
      />
    </>
  );
}
