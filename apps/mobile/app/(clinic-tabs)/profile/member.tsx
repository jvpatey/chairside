import { updateClinicMembershipProfile } from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ClinicMemberProfileFields } from '@/components/clinic/ClinicMemberProfileFields';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import {
  CLINIC_HOME,
  CLINIC_PROFILE_TEAM,
  navigateToClinicProfileHub,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicMemberProfileScreen() {
  const {
    isClinicProfileReady,
    isGroup,
    isOwner,
    membership,
    organization,
    clinicProfile,
    refreshClinicProfile,
  } = useClinicProfile();
  const { photoUri, hasPhoto, isUploading, pickPhoto, removePhoto } = useClinicMemberPhoto();

  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const groupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'your group';
  const canSave = Boolean(displayName.trim());

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    form: { gap: spacing.md },
    cancel: { alignItems: 'center' as const, paddingVertical: spacing.sm },
    cancelLabel: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
  }));

  useEffect(() => {
    if (!membership) return;
    setDisplayName(membership.display_name?.trim() || '');
    setTitle(membership.title?.trim() || (isOwner ? 'Owner' : 'Manager'));
    setBio(membership.bio?.trim() || '');
  }, [isOwner, membership]);

  if (!isClinicProfileReady) return null;
  if (!isGroup) {
    return <Redirect href={CLINIC_HOME} />;
  }
  if (!membership?.id) {
    return <Redirect href={CLINIC_PROFILE_TEAM} />;
  }

  const handleSave = async () => {
    if (!canSave) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateClinicMembershipProfile(membership.id, {
        display_name: displayName.trim(),
        title: title.trim() || (isOwner ? 'Owner' : 'Manager'),
        bio: bio.trim() || null,
      });
      await refreshClinicProfile();
      navigateToClinicProfileHub(router);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProfileDetailScreen
      title="Your profile"
      subtitle={`How you appear when posting and managing ${groupName}.`}
      onBack={() => navigateToClinicProfileHub(router)}>
      <View style={styles.form}>
        <ClinicMemberProfileFields
          displayName={displayName}
          title={title}
          bio={bio}
          onDisplayNameChange={setDisplayName}
          onTitleChange={setTitle}
          onBioChange={setBio}
          namePlaceholder={isOwner ? 'Alex Rivera' : 'Sarah Mitchell'}
          titlePlaceholder={isOwner ? 'Owner' : 'Office Manager'}
          photoUri={photoUri}
          isUploadingPhoto={isUploading}
          hasPhoto={hasPhoto}
          onPickPhoto={() => void pickPhoto()}
          onRemovePhoto={() => void removePhoto()}
          showValidation={showValidation}
          nameInvalid={!canSave}
        />
        <SetupStepFooter
          canContinue={canSave && !isUploading}
          validationMessage="Enter your name."
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel="Save changes"
          onContinue={() => void handleSave()}
        />
        <Pressable
          style={styles.cancel}
          onPress={() => navigateToClinicProfileHub(router)}>
          <Text style={styles.cancelLabel}>Cancel</Text>
        </Pressable>
      </View>
    </ProfileDetailScreen>
  );
}
