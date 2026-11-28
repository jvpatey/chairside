import {
  getAuthErrorMessage,
  setClinicAccountType,
  upsertClinicProfile,
} from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { ClinicTypeToggle, type ClinicTypeChoice } from '@/components/onboarding/ClinicTypeToggle';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { useThemedStyles } from '@/theme';

const COPY: Record<
  ClinicTypeChoice,
  { title: string; subtitle: string; label: string; placeholder: string; missing: string }
> = {
  individual: {
    title: 'What’s your clinic called?',
    subtitle: 'Use your practice name.',
    label: 'Clinic name',
    placeholder: 'Practice name',
    missing: 'Enter your clinic name to continue.',
  },
  group: {
    title: 'What’s your group called?',
    subtitle: 'Your group or company name. You’ll add each clinic next.',
    label: 'Group name',
    placeholder: 'Group name',
    missing: 'Enter your group name to continue.',
  },
};

export default function CaptureClinicNameScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { clinicProfile, locations, refreshClinicProfile } = useClinicProfile();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const rawName = clinicProfile?.clinic_name?.trim() ?? '';
  const [clinicName, setClinicName] = useState(
    rawName.toLowerCase() === 'clinic' ? '' : rawName,
  );
  const [accountType, setAccountType] = useState<ClinicTypeChoice>(
    clinicProfile?.account_type === 'group' ? 'group' : 'individual',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    const next = clinicProfile?.clinic_name?.trim() ?? '';
    setClinicName(next.toLowerCase() === 'clinic' ? '' : next);
  }, [clinicProfile?.clinic_name]);

  useEffect(() => {
    if (clinicProfile?.account_type) {
      setAccountType(clinicProfile.account_type === 'group' ? 'group' : 'individual');
    }
  }, [clinicProfile?.account_type]);

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isAuthReady && profile?.role && profile.role !== 'clinic') {
    return <Redirect href="/(onboarding)/role" />;
  }

  // Once a clinic address exists the type is fixed here; changing it happens in Settings.
  const hasSavedClinic =
    Boolean(clinicProfile?.address_line1?.trim()) ||
    locations.some((location) => location.is_active && Boolean(location.address_line1?.trim()));
  const copy = COPY[accountType];

  const handleContinue = async () => {
    if (!user?.id || isSubmitting) return;
    const name = clinicName.trim();
    if (!name) {
      setFormError(copy.missing);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      if (clinicProfile?.account_type !== accountType) {
        await setClinicAccountType(user.id, accountType, name);
      }
      await upsertClinicProfile(user.id, {
        clinic_name: name,
        account_type: accountType,
        organization_id: user.id,
      });
      captureAnalyticsEvent(AnalyticsEvents.clinicSignupAccountTypeSelected, {
        account_type: accountType,
      });
      await refreshClinicProfile();
      await refreshProfile(user.id);
      await handleAuthSuccess(refreshProfile, completeOnboarding, user.id);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <OnboardingButton
          label={isSubmitting ? 'Saving…' : 'Continue'}
          disabled={isSubmitting || !clinicName.trim()}
          onPress={() => void handleContinue()}
        />
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title={copy.title}
          subtitle={copy.subtitle}
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        {hasSavedClinic ? null : (
          <ClinicTypeToggle value={accountType} onChange={setAccountType} disabled={isSubmitting} />
        )}
        <AuthField
          label={copy.label}
          placeholder={copy.placeholder}
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
          icon="business-outline"
          editable={!isSubmitting}
          required
        />
      </Animated.View>
    </OnboardingShell>
  );
}
