import {
  authUserHasVerifiedPhone,
  getAuthErrorMessage,
  requestAuthPhoneBind,
  verifyAuthPhoneBind,
} from '@chairside/api';
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
import { FormSuccessBanner } from '@/components/ui/FormSuccessBanner';
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
  const [otpStep, setOtpStep] = useState<'phone' | 'code'>('phone');
  const [otpCode, setOtpCode] = useState('');
  const [phoneE164, setPhoneE164] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

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

  const finishWithProfileOnly = async (normalized: string) => {
    await save({ phone: normalized });
    await clearWorkerPostAuthCaptureSkip(user!.id, 'phone');
    await continueAfter();
  };

  const handleSendCode = async () => {
    if (!user?.id || isSubmitting) return;
    const normalized = normalizePhoneForStorage(phone);
    if (!normalized) {
      setFormError('Enter a valid 10-digit mobile number.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      // Already confirmed on Auth — skip SMS and just ensure profile matches.
      if (authUserHasVerifiedPhone(user, normalized)) {
        await finishWithProfileOnly(normalized);
        return;
      }

      const bind = await requestAuthPhoneBind(normalized);
      if (!bind.needsOtp) {
        await finishWithProfileOnly(normalized);
        return;
      }
      setPhoneE164(bind.e164);
      setOtpStep('code');
      setOtpCode('');
      setFormSuccess('We sent a text with your code.');
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not send code', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!user?.id || isSubmitting || otpCode.trim().length < 6) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      await verifyAuthPhoneBind(user.id, phoneE164 ?? phone, otpCode);
      await clearWorkerPostAuthCaptureSkip(user.id, 'phone');
      await continueAfter();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not verify phone', message);
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

  const canSend = phone.replace(/\D/g, '').length === 10;
  const canVerify = otpCode.trim().length >= 6;

  return (
    <OnboardingShell
      webLayout="centeredDecision"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={
              isSubmitting
                ? otpStep === 'code'
                  ? 'Verifying…'
                  : 'Sending…'
                : otpStep === 'code'
                  ? 'Verify and continue'
                  : 'Send code'
            }
            disabled={isSubmitting || (otpStep === 'code' ? !canVerify : !canSend)}
            onPress={() => void (otpStep === 'code' ? handleVerifyCode() : handleSendCode())}
          />
          {otpStep === 'code' ? (
            <OnboardingButton
              label="Use a different number"
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => {
                setOtpStep('phone');
                setOtpCode('');
                setPhoneE164(null);
                setFormSuccess(null);
                setFormError(null);
              }}
            />
          ) : (
            <OnboardingButton
              label="Skip for now"
              variant="ghost"
              disabled={isSubmitting}
              onPress={() => void handleSkip()}
            />
          )}
          <Text style={styles.footnote}>
            Verifying links this number to your account so you can sign in with it later.
          </Text>
        </View>
      }
    >
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.header, reducedMotion)}>
        <AuthScreenHeader
          title="Add a mobile number"
          subtitle={
            otpStep === 'code'
              ? 'Enter the code we texted you.'
              : 'Fill-in openings are sent by text — verify a mobile so you don’t miss them, and so you can sign in with this number.'
          }
          onBack={() => {
            if (otpStep === 'code') {
              setOtpStep('phone');
              setOtpCode('');
              setFormSuccess(null);
              setFormError(null);
              return;
            }
            router.back();
          }}
        />
      </Animated.View>
      <Animated.View entering={enterFadeUp(AUTH_STAGGER.form, reducedMotion)} style={styles.form}>
        <FormErrorBanner message={formError} />
        <FormSuccessBanner message={formSuccess} />
        {otpStep === 'phone' ? (
          <AuthField
            label="Mobile phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            editable={!isSubmitting}
          />
        ) : (
          <AuthField
            label="Verification code"
            placeholder="6-digit code"
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={setOtpCode}
            editable={!isSubmitting}
            autoComplete="one-time-code"
          />
        )}
      </Animated.View>
    </OnboardingShell>
  );
}
