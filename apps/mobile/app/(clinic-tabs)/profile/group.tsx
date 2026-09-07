import { normalizePracticeDoctors, type PracticeDoctor } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ClinicGroupProfileView } from '@/components/clinic/ClinicGroupProfileView';
import { PracticeDoctorsInput } from '@/components/clinic/PracticeDoctorsInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicGroupProfileScreen() {
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    isOwner,
    organization,
    locations,
    refreshClinicProfile,
  } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const [isEditing, setIsEditing] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [practiceDoctors, setPracticeDoctors] = useState<PracticeDoctor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const groupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'Dental group';
  const activeLocations = locations.filter((location) => location.is_active);
  const canSave = Boolean(clinicName.trim());

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setClinicName(clinicProfile.clinic_name?.trim() ?? '');
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
    setDescription(clinicProfile.description ?? '');
    setWebsite(clinicProfile.website ?? '');
    setPracticeDoctors(normalizePracticeDoctors(clinicProfile.practice_doctors ?? []));
  }, [clinicProfile]);

  if (!isClinicProfileReady) return null;
  if (!isGroup) {
    return <Redirect href="/(clinic-tabs)/profile" />;
  }
  if (!isOwner) {
    return <Redirect href="/(clinic-tabs)/profile" />;
  }

  const handleSave = async () => {
    if (!canSave) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await save({
        clinic_name: clinicName.trim(),
        phone: phone.trim() || null,
        description: description.trim() || null,
        website: website.trim() || null,
        practice_doctors: normalizePracticeDoctors(practiceDoctors),
        account_type: 'group',
      });
      await refreshClinicProfile();
      setIsEditing(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save group profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <ProfileDetailScreen
        title="Edit group profile"
        subtitle="Update how your group appears to candidates."
        onBack={() => setIsEditing(false)}>
        <View style={styles.form}>
          <AuthField
            label="Group name"
            placeholder="Group or brand name"
            value={clinicName}
            onChangeText={setClinicName}
            autoCapitalize="words"
            autoComplete="off"
            icon="business-outline"
            required
            invalid={showValidation && !clinicName.trim()}
          />
          <AuthField
            label="Group phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            icon="call-outline"
          />
          <PracticeDoctorsInput
            value={practiceDoctors}
            onChange={setPracticeDoctors}
            locations={activeLocations.map((location) => ({
              id: location.id,
              name: location.name,
            }))}
          />
          <AuthField
            label="Description"
            placeholder="Tell candidates about your team and culture"
            value={description}
            onChangeText={setDescription}
            autoCapitalize="sentences"
            multiline
            icon="text-outline"
          />
          <AuthField
            label="Website"
            placeholder="https://yourclinic.ca"
            value={website}
            onChangeText={setWebsite}
            keyboardType="url"
            autoCapitalize="none"
            icon="globe-outline"
          />
          <SetupStepFooter
            canContinue={canSave}
            validationMessage="Enter your group name."
            showValidation={showValidation}
            submitError={submitError}
            isSubmitting={isSubmitting}
            continueLabel="Save changes"
            onContinue={() => void handleSave()}
          />
        </View>
      </ProfileDetailScreen>
    );
  }

  return (
    <ProfileDetailScreen
      title="Group profile"
      subtitle="Your group identity, story, and doctors — what candidates see."
      actionLabel="Edit"
      onActionPress={() => setIsEditing(true)}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicGroupProfileView
        profile={clinicProfile}
        groupName={groupName}
        locations={locations}
      />
    </ProfileDetailScreen>
  );
}
