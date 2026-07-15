import { updateClinicMembershipProfile } from '@chairside/api';
import { router } from 'expo-router';
import { CLINIC_SETUP_LOCATION, CLINIC_SETUP_LOCATIONS } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSignOut } from '@/hooks/useSignOut';
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
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

export default function ClinicBasicsScreen() {
  const { profile: authProfile } = useAuth();
  const {
    clinicProfile,
    isClinicProfileReady,
    isGroup,
    membership,
    refreshClinicProfile,
  } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const { isSigningOut, signOut } = useSignOut();
  const [clinicName, setClinicName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberDisplayName, setMemberDisplayName] = useState('');
  const [memberTitle, setMemberTitle] = useState('Owner');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useClinicSetupStepGuard('basics', clinicProfile, isClinicProfileReady, isEditMode);

  const progress = getClinicSetupStepNumber('basics', isGroup);
  const basicsValidation = validateClinicBasicsStep({ clinicName, contactName, phone });
  const membershipNameMissing = isGroup && !memberDisplayName.trim();
  const validationOk = basicsValidation.ok && !membershipNameMissing;
  const validationMessage = membershipNameMissing
    ? 'Enter your name for the group.'
    : basicsValidation.message;

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.md },
    section: { gap: spacing.sm },
    sectionLabel: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    const rawName = clinicProfile.clinic_name?.trim() ?? '';
    // Ignore bootstrap placeholders left from account-type setup.
    const isBootstrapPlaceholder =
      !isEditMode && rawName.toLowerCase() === 'clinic';
    setClinicName(isBootstrapPlaceholder ? '' : (clinicProfile.clinic_name ?? ''));
    setContactName(clinicProfile.contact_name ?? '');
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
  }, [clinicProfile, isEditMode]);

  useEffect(() => {
    if (!isGroup) return;
    setMemberDisplayName(
      seedMembershipDisplayName(membership?.display_name, authProfile?.display_name),
    );
    setMemberTitle(membership?.title?.trim() || 'Owner');
  }, [authProfile?.display_name, isGroup, membership?.display_name, membership?.title]);

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
        });
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

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={validationOk}
          validationMessage={validationMessage}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title={isGroup ? 'Group basics' : 'Clinic basics'}
        subtitle={
          isGroup
            ? 'Name your clinic group, your role, and primary contact.'
            : 'Tell us about your practice.'
        }
        backLabel={isEditMode ? undefined : isSigningOut ? 'Signing out…' : 'Sign out'}
        onBack={() => (isEditMode ? router.replace(exitHref) : void signOut())}
      />
      {!isEditMode ? <SetupStepProgress step={progress.step} total={progress.total} /> : null}
      <View style={styles.form}>
        <AuthField
          label={isGroup ? 'Group name' : 'Clinic name'}
          placeholder={isGroup ? 'Group or brand name' : 'Practice name'}
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
          autoComplete="off"
          invalid={showValidation && !basicsValidation.ok && !clinicName.trim()}
        />
        {isGroup ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your profile</Text>
            <Text style={styles.hint}>
              Shown as your name and title when you post and manage the group.
            </Text>
            <AuthField
              label="Your name"
              placeholder="Alex Rivera"
              value={memberDisplayName}
              onChangeText={setMemberDisplayName}
              autoCapitalize="words"
              invalid={showValidation && membershipNameMissing}
            />
            <AuthField
              label="Your title"
              placeholder="Owner"
              value={memberTitle}
              onChangeText={setMemberTitle}
              autoCapitalize="words"
            />
          </View>
        ) : null}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.hint}>Phone or contact name required.</Text>
          <AuthField
            label="Contact name"
            placeholder="Office manager or owner"
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
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
            invalid={
              showValidation &&
              !basicsValidation.ok &&
              !contactName.trim() &&
              !phone.trim()
            }
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
