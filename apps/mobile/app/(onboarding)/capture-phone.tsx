import { getAuthErrorMessage } from '@chairside/api';
import { normalizePhoneForStorage } from '@chairside/config';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { AUTH_STAGGER, enterFadeUp } from '@/components/onboarding/onboardingAnimations';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { handleAuthSuccess } from '@/lib/handleAuthSuccess';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import {
  clearWorkerPostAuthCaptureSkip,
  markWorkerPostAuthCaptureSkipped,
} from '@/lib/workerPostAuthCapture';
import { useThemedStyles } from '@/theme';

export default function CapturePhoneScreen() {
  const { user, profile, refreshProfile, isAuthReady } = useAuth();
  const { workerProfile, refreshWorkerProfile } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { completeOnboarding } = useOnboarding();
  const reducedMotion = useReducedMotion();
  const [phone, setPhone] = useState(
    workerProfile?.phone ? formatPhoneNumber(workerProfile.phone) : '',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    form: {
      gap: spacing.md,
    },
    footer: {
      gap: spacing.sm,
    },
    footnote: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
      textAlign: 'center' as const,
    },
  }));

  useEffect(() => {
    if (workerProfile?.phone) {
      setPhone(formatPhoneNumber(workerProfile.phone));
    }
  }, [workerProfile?.phone]);

  if (isAuthReady && !user) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (isAuthReady && profile?.role && profile.role !== 'worker') {
    return <Redirect href="/(onboarding)/role" />;
  }

  const continueAfter = async () => {
    await refreshProfile(user!.id);
    await refreshWorkerProfile();
    await handleAuthSuccess(refreshProfile, completeOnboarding, user!.id);
  };

  const handleContinue = async () => {
    if (!user?.id || isSubmitting) return;
    const normalized = normalizePhoneForStorage(phone);
    if (!normalized) {
      setFormError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await save({ phone: normalized });
      await clearWorkerPostAuthCaptureSkip(user.id, 'phone');
      await continueAfter();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save phone', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!user?.id || isSubmitting) return;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await markWorkerPostAuthCaptureSkipped(user.id, 'phone');
      await continueAfter();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting || phone.replace(/\D/g, '').length !== 10}
            onPress={() => void handleContinue()}
          />
          <OnboardingButton
            label="Skip for now"
            variant="ghost"
            disabled={isSubmitting}
            onPress={() => void handleSkip()}
          />
          <Text style={styles.footnote}>You can add a number anytime in Profile.</Text>
        </View>
      }>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Add a mobile number"
          subtitle="Fill-in openings are sent by text — add a mobile so you don’t miss them."
          onBack={() => router.back()}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <AuthField
          label="Mobile phone"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
          editable={!isSubmitting}
        />
      </Animated.View>
    </OnboardingShell>
  );
}
