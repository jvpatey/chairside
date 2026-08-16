import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { ProfilePhotoCropEditor } from '@/components/worker/ProfilePhotoCropEditor';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useTheme, useThemedStyles } from '@/theme';

export function ClinicLogoSetupField() {
  const { clinicProfile, isGroup } = useClinicProfile();
  const { colors } = useTheme();
  const {
    logoUri,
    hasLogo,
    isUploading,
    cropCandidate,
    pickLogo,
    cancelCrop,
    confirmCrop,
    removeLogo,
  } = useClinicLogo();

  const styles = useThemedStyles(({ spacing, typography }) => ({
    section: { gap: spacing.sm, alignItems: 'center' as const },
    labelRow: { alignSelf: 'stretch' as const, gap: spacing.xs },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    action: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    secondary: { ...typography.body, color: colors.labelSecondary },
  }));

  const clinicName =
    clinicProfile?.clinic_name?.trim() || (isGroup ? 'Your group' : 'Your clinic');

  return (
    <>
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <FormSectionHeader
            icon="image-outline"
            label={isGroup ? 'Group logo' : 'Clinic logo'}
            hint="Shown on your profile and postings so candidates recognize your practice."
          />
        </View>
        <Pressable
          onPress={() => void pickLogo()}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel={hasLogo ? 'Change clinic logo' : 'Add clinic logo'}>
          <ClinicLogoAvatar
            clinicName={clinicName}
            logoUri={logoUri}
            size={88}
            isLoading={isUploading}
          />
        </Pressable>
        <View style={styles.actions}>
          <Pressable disabled={isUploading} onPress={() => void pickLogo()}>
            <Text style={styles.action}>
              {isUploading ? 'Uploading…' : hasLogo ? 'Change photo' : 'Add photo'}
            </Text>
          </Pressable>
          {hasLogo ? (
            <Pressable disabled={isUploading} onPress={() => void removeLogo()}>
              <Text style={styles.secondary}>Remove</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {cropCandidate ? (
        <ProfilePhotoCropEditor
          visible
          imageUri={cropCandidate.uri}
          imageWidth={cropCandidate.width}
          imageHeight={cropCandidate.height}
          isSaving={isUploading}
          onCancel={cancelCrop}
          onConfirm={(transform) => void confirmCrop(transform)}
        />
      ) : null}
    </>
  );
}
