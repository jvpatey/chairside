import { isClinicGroupsEnabled, setClinicAccountType, type ClinicAccountType } from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RoleCard } from '@/components/onboarding/RoleCard';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useSignOut } from '@/hooks/useSignOut';
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
import { CLINIC_SETUP_BASICS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function ClinicAccountTypeScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady, refreshClinicProfile } = useClinicProfile();
  const { isSigningOut, signOut } = useSignOut();
  const [accountType, setAccountType] = useState<ClinicAccountType | null>(
    clinicProfile?.account_type ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const progress = getClinicSetupStepNumber('account-type', accountType === 'group');

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.md },
    hint: typography.subtitle,
  }));

  if (!isClinicGroupsEnabled()) {
    return <Redirect href={CLINIC_SETUP_BASICS} />;
  }

  if (!isClinicProfileReady) return null;

  const handleContinue = async () => {
    if (!accountType) {
      setShowValidation(true);
      return;
    }
    if (!user?.id) {
      setSubmitError('Not signed in');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await setClinicAccountType(user.id, accountType);
      await refreshClinicProfile();
      router.push(CLINIC_SETUP_BASICS);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Could not save. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={Boolean(accountType)}
          validationMessage="Choose how your clinic is organized to continue."
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel="Continue"
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="How is your practice set up?"
        backLabel={isSigningOut ? 'Signing out…' : 'Sign out'}
        onBack={() => void signOut()}
      />
      <SetupStepProgress step={progress.step} total={progress.total} />
      <View style={styles.form}>
        <Text style={styles.hint}>Choose the structure that best matches your account.</Text>
        <RoleCard
          title="One clinic"
          description="A single practice location."
          icon="business-outline"
          selected={accountType === 'individual'}
          onPress={() => setAccountType('individual')}
          accent="primary"
        />
        <RoleCard
          title="Clinic group"
          description="Multiple locations under one account."
          icon="map-outline"
          selected={accountType === 'group'}
          onPress={() => setAccountType('group')}
          accent="primary"
        />
      </View>
    </OnboardingShell>
  );
}
