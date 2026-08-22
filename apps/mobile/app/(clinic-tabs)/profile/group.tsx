import { router } from 'expo-router';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ClinicGroupDetailsView } from '@/components/clinic/ClinicGroupDetailsView';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicGroupDetailsScreen() {
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    isOwner,
    organization,
    refreshClinicProfile,
  } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const [isEditing, setIsEditing] = useState(false);
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const groupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'Dental group';
  const canSave = Boolean(clinicName.trim());

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setClinicName(clinicProfile.clinic_name?.trim() ?? '');
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
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
        account_type: 'group',
      });
      await refreshClinicProfile();
      setIsEditing(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save group details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <ProfileDetailScreen
        title="Edit group details"
        subtitle="Update your group name and contact phone."
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
      title="Group details"
      subtitle="Your group name and contact phone."
      actionLabel="Edit"
      onActionPress={() => setIsEditing(true)}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ClinicGroupDetailsView profile={clinicProfile} groupName={groupName} />
    </ProfileDetailScreen>
  );
}
