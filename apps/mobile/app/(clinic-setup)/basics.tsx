import {
  isClinicGroupsEnabled,
  joinDisplayName,
  resolveAuthNameParts,
  updateClinicMembershipProfile,
  uploadClinicMemberPhotoFromBase64,
} from '@chairside/api';
import { router } from 'expo-router';
import {
  CLINIC_SETUP_ACCOUNT_TYPE,
  CLINIC_SETUP_LOCATION,
  CLINIC_SETUP_LOCATIONS,
  ONBOARDING_CHANGE_ROLE,
} from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ClinicMemberProfileFields } from '@/components/clinic/ClinicMemberProfileFields';
import { pickLocationPhotoFile } from '@/components/clinic/ClinicLocationPhotoField';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicMemberPhotoUri } from '@/hooks/useClinicMemberPhotoUri';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { validateClinicBasicsStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

function seedMembershipDisplayName(
  membershipName: string | null | undefined,
  authDisplayName: string | null | undefined,
): string {
  const membership = membershipName?.trim() ?? '';
  if (membership && membership.toLowerCase() !== 'owner') return membership;
  return authDisplayName?.trim() || membership;
}

type PendingMemberPhoto = {
  uri: string;
  base64: string;
  contentType: string;
};

export default function ClinicBasicsScreen() {
  const { user, profile: authProfile } = useAuth();
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    membership,
    organization,
    refreshClinicProfile,
  } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
  const savedMemberPhotoUri = useClinicMemberPhotoUri(membership?.photo_storage_path);
  const [clinicName, setClinicName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberDisplayName, setMemberDisplayName] = useState('');
  const [memberTitle, setMemberTitle] = useState('Owner');
  const [memberBio, setMemberBio] = useState('');
  const [pendingPhoto, setPendingPhoto] = useState<PendingMemberPhoto | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const authNameParts = resolveAuthNameParts({
    firstName: authProfile?.first_name,
    lastName: authProfile?.last_name,
    displayName: authProfile?.display_name,
    userMetadata: user?.user_metadata as Record<string, unknown> | undefined,
  });
  const authDisplayName = joinDisplayName(authNameParts.firstName, authNameParts.lastName);

  useClinicSetupStepGuard('basics', clinicProfile, isClinicProfileReady, isEditMode);

  const progress = useSetupStepProgress('basics', { role: 'clinic' });
  const basicsValidation = validateClinicBasicsStep({ clinicName, contactName, phone });
  const membershipNameMissing = isGroup && !memberDisplayName.trim();
  const validationOk = basicsValidation.ok && !membershipNameMissing;
  const validationMessage = membershipNameMissing
    ? 'Enter your name for the group.'
    : basicsValidation.message;

  const memberPhotoDisplayUri = pendingPhoto?.uri ?? savedMemberPhotoUri;
  const hasMemberPhoto = Boolean(memberPhotoDisplayUri);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
    section: { gap: spacing.sm },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    const rawName = clinicProfile.clinic_name?.trim() ?? '';
    // Ignore bootstrap placeholders left from account-type setup.
    const isBootstrapPlaceholder =
      !isEditMode && rawName.toLowerCase() === 'clinic';
    setClinicName(isBootstrapPlaceholder ? '' : (clinicProfile.clinic_name ?? ''));
    const savedContact = clinicProfile.contact_name?.trim() ?? '';
    setContactName(savedContact || authDisplayName);
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
  }, [authDisplayName, clinicProfile, isEditMode]);

  useEffect(() => {
    if (!isGroup) return;
    setMemberDisplayName(seedMembershipDisplayName(membership?.display_name, authDisplayName));
    setMemberTitle(membership?.title?.trim() || 'Owner');
    setMemberBio(membership?.bio?.trim() || '');
  }, [authDisplayName, isGroup, membership?.bio, membership?.display_name, membership?.title]);

  const handlePickPhoto = async () => {
    try {
      setIsUploadingPhoto(true);
      const picked = await pickLocationPhotoFile();
      if (!picked) return;
      setPendingPhoto(picked);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not select photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleContinue = async () => {
    if (!validationOk) {
      setShowValidation(true);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        clinic_name: clinicName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        account_type: isGroup ? 'group' : clinicProfile?.account_type ?? 'individual',
      });
      if (isGroup && membership?.id) {
        await updateClinicMembershipProfile(membership.id, {
          display_name: memberDisplayName.trim(),
          title: memberTitle.trim() || 'Owner',
          bio: memberBio.trim() || null,
        });
        if (pendingPhoto) {
          const organizationId = organization?.id ?? membership.organization_id;
          await uploadClinicMemberPhotoFromBase64(
            organizationId,
            membership.id,
            pendingPhoto.base64,
            pendingPhoto.contentType,
            membership.photo_storage_path,
          );
          setPendingPhoto(null);
        }
        await refreshClinicProfile();
      }
      if (isEditMode) {
        router.replace(exitHref);
      } else if (isGroup) {
        router.push(CLINIC_SETUP_LOCATIONS);
      } else {
        router.push(CLINIC_SETUP_LOCATION);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady) return null;

  const groupsEnabled = isClinicGroupsEnabled();
  const canStepBackToAccountType = groupsEnabled && Boolean(clinicProfile?.account_type);
  const handleBack = () => {
    if (isEditMode) {
      router.replace(exitHref);
      return;
    }
    if (canStepBackToAccountType) {
      router.replace(CLINIC_SETUP_ACCOUNT_TYPE);
      return;
    }
    router.replace(ONBOARDING_CHANGE_ROLE);
  };

  return (
    <FormScreen
      {...setupFormProps}
      title={isGroup ? 'Group basics' : 'Clinic basics'}
      subtitle={
        isGroup
          ? 'Name your clinic group, your role, and primary contact.'
          : 'Tell us about your practice.'
      }
      backLabel={isEditMode ? undefined : 'Back'}
      onBack={handleBack}
      footer={
        <SetupStepFooter
          canContinue={validationOk && !isUploadingPhoto}
          validationMessage={validationMessage}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        <AuthField
          label={isGroup ? 'Group name' : 'Clinic name'}
          placeholder={isGroup ? 'Group or brand name' : 'Practice name'}
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
          autoComplete="off"
          icon="business-outline"
          required
          invalid={showValidation && !basicsValidation.ok && !clinicName.trim()}
        />
        {isGroup ? (
          <View style={styles.section}>
            <FormSectionHeader
              icon="person-circle-outline"
              label="Your profile"
              hint="Shown as your name and title when you post and manage the group."
            />
            <ClinicMemberProfileFields
              displayName={memberDisplayName}
              title={memberTitle}
              bio={memberBio}
              onDisplayNameChange={setMemberDisplayName}
              onTitleChange={setMemberTitle}
              onBioChange={setMemberBio}
              photoUri={memberPhotoDisplayUri}
              isUploadingPhoto={isUploadingPhoto}
              hasPhoto={hasMemberPhoto}
              onPickPhoto={() => void handlePickPhoto()}
              onRemovePhoto={
                pendingPhoto
                  ? () => setPendingPhoto(null)
                  : undefined
              }
              showValidation={showValidation}
              nameInvalid={membershipNameMissing}
              displayNameRequired
            />
          </View>
        ) : null}
        <View style={styles.section}>
          <FormSectionHeader
            icon="call-outline"
            label="Contact"
            required
            hint="Provide at least a phone number or contact name."
          />
          <AuthField
            label="Contact name"
            placeholder="Office manager or owner"
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
            icon="person-outline"
            invalid={
              showValidation &&
              !basicsValidation.ok &&
              !contactName.trim() &&
              !phone.trim()
            }
          />
          <AuthField
            label="Phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            icon="call-outline"
            invalid={
              showValidation &&
              !basicsValidation.ok &&
              !contactName.trim() &&
              !phone.trim()
            }
          />
        </View>
      </View>
    </FormScreen>
  );
}
